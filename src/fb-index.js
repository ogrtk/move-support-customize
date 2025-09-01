/**
 * FormBridge カスタマイズ: テーブル内の開始時刻・終了時刻バリデーション
 * 開始時刻 > 終了時刻の場合にエラーを表示する
 */

(() => {
	// 定数定義 - 必要に応じて変更してください
	const FIELD_CODES = {
		TABLE_CODE: "テーブル", // テーブルのフィールドコード
		START_TIME: "開始時刻", // 開始時刻のフィールドコード
		END_TIME: "終了時刻", // 終了時刻のフィールドコード
		NEXT_DAY_FLAG: "翌日フラグ", // 翌日フラグのフィールドコード
	};

	// エラーメッセージ
	const ERROR_MESSAGES = {
		INVALID_TIME_RANGE: "開始時刻は終了時刻より前に設定してください",
	};

	/**
	 * 時刻文字列を比較用のDateオブジェクトに変換
	 * @param {string} timeString - HH:MM形式の時刻文字列
	 * @returns {Date} - 比較用のDateオブジェクト
	 */
	function parseTimeString(timeString) {
		if (!timeString) return null;

		const [hours, minutes] = timeString.split(":");
		// 固定日付（1900年1月1日）を使用して時刻比較の一貫性を保つ
		const date = new Date(1900, 0, 1);
		date.setHours(Number.parseInt(hours, 10));
		date.setMinutes(Number.parseInt(minutes, 10));
		date.setSeconds(0);
		date.setMilliseconds(0);

		return date;
	}

	/**
	 * 指定行の時刻バリデーションを実行
	 * @param {number} rowIndex - バリデーション対象の行インデックス
	 * @param {Object} changedFieldValues - 変更されたフィールドの値（オプショナル）
	 * @returns {boolean} - バリデーション結果（true: OK, false: NG）
	 */
	function validateTimeRange(rowIndex, changedFieldValues = {}) {
		const record = formBridge.fn.getRecord();
		const tableData = record[FIELD_CODES.TABLE_CODE];

		if (!tableData || !tableData.value[rowIndex]) {
			return true; // データがない場合はOK
		}

		const row = tableData.value[rowIndex];

		// 変更されたフィールドの値があれば使用、なければレコードから取得
		const startTimeValue =
			changedFieldValues[FIELD_CODES.START_TIME] !== undefined
				? changedFieldValues[FIELD_CODES.START_TIME]
				: row.value[FIELD_CODES.START_TIME].value;

		const endTimeValue =
			changedFieldValues[FIELD_CODES.END_TIME] !== undefined
				? changedFieldValues[FIELD_CODES.END_TIME]
				: row.value[FIELD_CODES.END_TIME].value;

		const nextDayFlag =
			changedFieldValues[FIELD_CODES.NEXT_DAY_FLAG] !== undefined
				? changedFieldValues[FIELD_CODES.NEXT_DAY_FLAG]
				: row.value[FIELD_CODES.NEXT_DAY_FLAG].value;

		// どちらかが空の場合はバリデーションしない
		if (!startTimeValue || !endTimeValue) {
			return true;
		}

		const startTime = parseTimeString(startTimeValue);
		const endTime = parseTimeString(endTimeValue);

		if (!startTime || !endTime) {
			return true; // パース失敗時はOK
		}

		// 翌日フラグがチェックされている場合は、開始時刻 > 終了時刻でもOK
		if (nextDayFlag && nextDayFlag.length > 0) {
			return true;
		}

		return startTime <= endTime;
	}

	/**
	 * エラーメッセージを設定/クリア
	 * @param {number} rowIndex - 対象行インデックス
	 * @param {boolean} hasError - エラーがあるかどうか
	 * @param {Object} context - イベントコンテキスト（オプショナル）
	 */
	function setTimeValidationError(rowIndex, hasError, context) {
		if (hasError) {
			// エラーメッセージを両方のフィールドに設定
			if (context?.setSubtableFieldValueError) {
				context.setSubtableFieldValueError(
					FIELD_CODES.TABLE_CODE,
					FIELD_CODES.START_TIME,
					rowIndex,
					ERROR_MESSAGES.INVALID_TIME_RANGE,
				);
				context.setSubtableFieldValueError(
					FIELD_CODES.TABLE_CODE,
					FIELD_CODES.END_TIME,
					rowIndex,
					ERROR_MESSAGES.INVALID_TIME_RANGE,
				);
			}
		} else {
			// エラーメッセージをクリア
			if (context?.setSubtableFieldValueError) {
				context.setSubtableFieldValueError(
					FIELD_CODES.TABLE_CODE,
					FIELD_CODES.START_TIME,
					rowIndex,
					null,
				);
				context.setSubtableFieldValueError(
					FIELD_CODES.TABLE_CODE,
					FIELD_CODES.END_TIME,
					rowIndex,
					null,
				);
			}
		}
	}

	/**
	 * 全テーブル行の時刻バリデーションを実行
	 * @returns {boolean} - 全行でバリデーションOKかどうか
	 */
	function validateAllTimeRanges() {
		const record = formBridge.fn.getRecord();
		const tableData = record[FIELD_CODES.TABLE_CODE];

		if (!tableData) {
			return true; // テーブルデータがない場合はOK
		}

		let allValid = true;

		for (let i = 0; i < tableData.value.length; i++) {
			const isValid = validateTimeRange(i);
			if (!isValid) {
				allValid = false;
			}
		}

		return allValid;
	}

	// FormBridge イベントハンドラの登録

	/**
	 * 時刻関連フィールド変更時の共通バリデーション処理
	 * @param {string} fieldCode - 変更されたフィールドのコード
	 * @returns {Function} - イベントハンドラ関数
	 */
	function createTimeFieldChangeHandler(fieldCode) {
		return (context) => {
			const rowIndex = context.rowIndex;
			const newValue = context.value;

			const changedFieldValues = {
				[fieldCode]: newValue,
			};

			const isValid = validateTimeRange(rowIndex, changedFieldValues);
			setTimeValidationError(rowIndex, !isValid, context);
		};
	}

	// 開始時刻変更時のバリデーション
	formBridge.events.on(
		`form.field.change.${FIELD_CODES.TABLE_CODE}.${FIELD_CODES.START_TIME}`,
		createTimeFieldChangeHandler(FIELD_CODES.START_TIME),
	);

	// 終了時刻変更時のバリデーション
	formBridge.events.on(
		`form.field.change.${FIELD_CODES.TABLE_CODE}.${FIELD_CODES.END_TIME}`,
		createTimeFieldChangeHandler(FIELD_CODES.END_TIME),
	);

	// 翌日フラグ変更時のバリデーション
	formBridge.events.on(
		`form.field.change.${FIELD_CODES.TABLE_CODE}.${FIELD_CODES.NEXT_DAY_FLAG}`,
		createTimeFieldChangeHandler(FIELD_CODES.NEXT_DAY_FLAG),
	);

	// フォーム送信時の全体バリデーション
	formBridge.events.on("form.submit", (context) => {
		const allValid = validateAllTimeRanges();

		if (!allValid) {
			// バリデーションエラーがある場合は送信を停止
			context.preventDefault();

			// 個別のエラーメッセージは各フィールドに既に設定済み
			// 必要に応じて全体的なエラーメッセージを表示
			console.warn(
				"時刻の入力に不正があります。開始時刻は終了時刻より前に設定してください。",
			);
		}
	});

	console.log("FormBridge 時刻バリデーションカスタマイズが読み込まれました");
})();
