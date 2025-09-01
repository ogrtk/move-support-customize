/**
 * kViewer カスタマイズ: 月別集計表示
 * 有効な年月データと明細データを外部APIから取得し、年月ごとに件数と合計金額を集計して表示する
 */

(() => {
	//********************************************
	// 設定
	//********************************************
	// テーブル表示要素
	// ※kViewerのヘッダコンテンツをhtmlとし、
	//     <div id="totaltable"></div>
	//   を記述してください。
	//   この位置に集計テーブルが表示されます
	const TARGET_ELEMENT_ID = "totaltable";

	// 外部公開API
	const API_CONFIG = {
		YMCONTROL_URL:
			"https://d5326d33.viewer.kintoneapp.com/public/api/records/384efdb13bf7b53195273226af9eb791c5861d4426c64ac85d753dbc2299783c/1", // 有効な年月データAPI
		USAGEREPORT_URL:
			"https://d5326d33.viewer.kintoneapp.com/public/api/records/9d1d30b38d299db20c1628dbdf7a4912436b2a75430bc44a850f5dadaf245698/1", // 明細データAPI
	};

	// 年月コントロール フィールド名
	const YMCONTROL_FIELDS = {
		YEAR_MONTH: "年月",
	};

	// 利用報告 フィールド名
	const USAGEREPORT_FIELDS = {
		USAGE_YEAR_MONTH: "利用年月",
		TOTAL: "合計",
	};
	//********************************************
	// 設定ここまで
	//********************************************

	// テーブルのヘッダーとスタイル設定
	const TABLE_CONFIG = {
		HEADERS: ["年月", "件数", "合計金額"],
		STYLE: `
          #totaltable table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #totaltable th, #totaltable td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
          }
          #totaltable th {
              background-color: #f5f5f5;
              font-weight: bold;
          }
          #totaltable tr:nth-child(even) {
              background-color: #f9f9f9;
          }
          #totaltable .amount {
              text-align: right;
          }
          #totaltable .count {
              text-align: center;
          }
          #totaltable .loading {
              text-align: center;
              padding: 20px;
              color: #666;
          }
          #totaltable .error {
              text-align: center;
              padding: 20px;
              color: #d32f2f;
              background-color: #ffebee;
              border-radius: 4px;
          }
      `,
	};

	/**
	 * 外部APIからデータを取得
	 * @param {string} url - API URL
	 * @returns {Promise<Object>} - レスポンスデータ
	 */
	async function fetchData(url) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error(`API取得エラー (${url}):`, error);
			throw error;
		}
	}

	/**
	 * 年月文字列をDate型に変換（比較用）
	 * @param {string} yearMonth - YYYY-MM形式の年月文字列
	 * @returns {Date} - 変換されたDateオブジェクト
	 */
	function parseYearMonth(yearMonth) {
		if (!yearMonth || typeof yearMonth !== "string") return null;

		const [year, month] = yearMonth.split("-");
		if (!year || !month) return null;

		return new Date(
			Number.parseInt(year, 10),
			Number.parseInt(month, 10) - 1,
			1,
		);
	}

	/**
	 * 明細データを有効な年月で絞り込み
	 * @param {Array} detailData - 明細データ配列
	 * @param {Array} validMonths - 有効な年月データ配列
	 * @returns {Array} - 絞り込まれた明細データ
	 */
	function filterDetailData(detailData, validMonths) {
		if (!Array.isArray(detailData) || !Array.isArray(validMonths)) {
			return [];
		}

		// 有効な年月をセットに変換（高速検索用）
		const validMonthsSet = new Set(
			validMonths.map((item) =>
				typeof item === "string" ? item : item.yearMonth || item.year_month,
			),
		);

		return detailData.filter((item) => {
			if (!item) return false;

			// kintone形式の利用年月フィールドのみをチェック
			let yearMonth;
			if (
				item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH] &&
				item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH].value
			) {
				yearMonth = item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH].value.replace(
					"/",
					"-",
				);
			} else {
				throw new Error(
					`必須項目が見つかりません: ${USAGEREPORT_FIELDS.USAGE_YEAR_MONTH}`,
				);
			}
			return yearMonth && validMonthsSet.has(yearMonth);
		});
	}

	/**
	 * 年月ごとに明細データを集計
	 * @param {Array} filteredData - 絞り込まれた明細データ
	 * @returns {Array} - 年月ごとの集計結果
	 */
	function aggregateByMonth(filteredData) {
		if (!Array.isArray(filteredData)) {
			return [];
		}

		const aggregatedData = {};

		for (const item of filteredData) {
			if (!item) continue;

			// kintone形式の利用年月フィールドのみをチェック
			let yearMonth;
			if (
				item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH] &&
				item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH].value
			) {
				yearMonth = item[USAGEREPORT_FIELDS.USAGE_YEAR_MONTH].value.replace(
					"/",
					"-",
				);
			} else {
				throw new Error(
					`必須項目が見つかりません: ${USAGEREPORT_FIELDS.USAGE_YEAR_MONTH}`,
				);
			}

			// kintone形式の合計フィールドのみをチェック
			let amount = 0;
			if (
				item[USAGEREPORT_FIELDS.TOTAL] &&
				item[USAGEREPORT_FIELDS.TOTAL].value
			) {
				amount = item[USAGEREPORT_FIELDS.TOTAL].value;
			} else {
				throw new Error(
					`必須項目が見つかりません: ${USAGEREPORT_FIELDS.TOTAL}`,
				);
			}

			amount = Number.parseFloat(amount) || 0;

			if (!yearMonth) continue;

			if (!aggregatedData[yearMonth]) {
				aggregatedData[yearMonth] = {
					yearMonth: yearMonth,
					count: 0,
					totalAmount: 0,
				};
			}

			aggregatedData[yearMonth].count++;
			aggregatedData[yearMonth].totalAmount += amount;
		}

		// オブジェクトを配列に変換し、年月でソート
		return Object.values(aggregatedData).sort((a, b) => {
			const dateA = parseYearMonth(a.yearMonth);
			const dateB = parseYearMonth(b.yearMonth);

			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		});
	}

	/**
	 * 金額をフォーマット（3桁区切り）
	 * @param {number} amount - 金額
	 * @returns {string} - フォーマット済み金額
	 */
	function formatAmount(amount) {
		if (typeof amount !== "number" || Number.isNaN(amount)) {
			return "0";
		}
		return amount.toLocaleString("ja-JP");
	}

	/**
	 * 集計結果テーブルのHTML生成
	 * @param {Array} aggregatedData - 集計データ
	 * @returns {string} - テーブルHTML
	 */
	function createTableHTML(aggregatedData) {
		if (!Array.isArray(aggregatedData) || aggregatedData.length === 0) {
			return '<div class="error">表示するデータがありません</div>';
		}

		let tableHTML = `
          <table>
              <thead>
                  <tr>
                      ${TABLE_CONFIG.HEADERS.map((header) => `<th>${header}</th>`).join("")}
                  </tr>
              </thead>
              <tbody>
      `;

		for (const item of aggregatedData) {
			tableHTML += `
              <tr>
                  <td>${item.yearMonth || ""}</td>
                  <td class="count">${item.count || 0}</td>
                  <td class="amount">¥${formatAmount(item.totalAmount || 0)}</td>
              </tr>
          `;
		}

		tableHTML += `
              </tbody>
          </table>
      `;

		return tableHTML;
	}

	/**
	 * CSS スタイルを追加
	 */
	function addStyles() {
		const styleElement = document.createElement("style");
		styleElement.textContent = TABLE_CONFIG.STYLE;
		document.head.appendChild(styleElement);
	}

	/**
	 * 指定要素にローディング表示
	 * @param {HTMLElement} element - 対象要素
	 */
	function showLoading(element) {
		if (element) {
			element.innerHTML = '<div class="loading">データを読み込み中...</div>';
		}
	}

	/**
	 * 指定要素にエラー表示
	 * @param {HTMLElement} element - 対象要素
	 * @param {string} message - エラーメッセージ
	 */
	function showError(element, message) {
		if (element) {
			element.innerHTML = `<div class="error">エラー: ${message}</div>`;
		}
	}

	/**
	 * メインの集計処理とテーブル表示
	 */
	async function displayMonthlySummary() {
		const targetElement = document.getElementById(TARGET_ELEMENT_ID);

		if (!targetElement) {
			console.error(`要素が見つかりません: ${TARGET_ELEMENT_ID}`);
			return;
		}

		// ローディング表示
		showLoading(targetElement);

		try {
			// 両方のAPIからデータを並行取得
			const [validMonthsData, detailData] = await Promise.all([
				fetchData(API_CONFIG.YMCONTROL_URL),
				fetchData(API_CONFIG.USAGEREPORT_URL),
			]);

			// データの妥当性チェック
			let validMonths = [];
			if (Array.isArray(validMonthsData)) {
				validMonths = validMonthsData;
			} else if (
				validMonthsData.records &&
				Array.isArray(validMonthsData.records)
			) {
				// kintoneのレコード形式から年月データを抽出
				validMonths = validMonthsData.records.map((record) => {
					const yearMonthField = record[YMCONTROL_FIELDS.YEAR_MONTH];
					if (!yearMonthField || !yearMonthField.value) {
						throw new Error(
							`必須項目が見つかりません: ${YMCONTROL_FIELDS.YEAR_MONTH}`,
						);
					}
					// "YYYY/MM" 形式を "YYYY-MM" 形式に変換
					return yearMonthField.value.replace("/", "-");
				});
			} else {
				validMonths = validMonthsData.data || [];
			}

			const details = Array.isArray(detailData)
				? detailData
				: detailData.records || detailData.data || [];

			if (validMonths.length === 0) {
				throw new Error("有効な年月データが取得できませんでした");
			}

			if (details.length === 0) {
				throw new Error("明細データが取得できませんでした");
			}

			// データ処理
			const filteredData = filterDetailData(details, validMonths);
			const aggregatedData = aggregateByMonth(filteredData);

			// テーブル表示
			targetElement.innerHTML = createTableHTML(aggregatedData);

			console.log("月別集計表示が完了しました:", {
				validMonthsCount: validMonths.length,
				detailDataCount: details.length,
				filteredDataCount: filteredData.length,
				aggregatedDataCount: aggregatedData.length,
			});
		} catch (error) {
			console.error("月別集計表示エラー:", error);
			showError(targetElement, error.message);
		}
	}

	// kViewer イベント処理
	if (typeof kv !== "undefined") {
		// ビュー作成時に初期化
		kv.events.view.created = () => {
			console.log("kViewer月別集計カスタマイズが初期化されました");
			addStyles();
		};

		// レコード取得完了後に集計表示
		kv.events.records.fetched = () => {
			console.log("kViewerレコード取得完了 - 月別集計を開始します");
			displayMonthlySummary();
		};
	} else {
		console.warn(
			"kVオブジェクトが見つかりません。kViewer環境外で実行されている可能性があります。",
		);

		// kViewer環境外での動作確認用（開発時）
		document.addEventListener("DOMContentLoaded", () => {
			addStyles();
			// 少し遅延させて要素の準備を待つ
			setTimeout(displayMonthlySummary, 1000);
		});
	}

	console.log("kViewer月別集計カスタマイズが読み込まれました");
})();
