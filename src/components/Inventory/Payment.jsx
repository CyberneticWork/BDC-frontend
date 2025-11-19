import React, { useMemo, useState } from "react";

function Section({ title, children }) {
	return (
		<div className="border border-gray-200 rounded-lg p-4 mt-3">
			<div className="font-semibold mb-2 text-gray-800">{title}</div>
			{children}
		</div>
	);
}

export default function Payment({ onSetPayment, initialMode = "cash" }) {
	const [mode, setMode] = useState(initialMode);
	const [showErrors, setShowErrors] = useState(false);

	// Common fields
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");

	// Online transfer fields
	const [bankName, setBankName] = useState("");
	const [referenceNo, setReferenceNo] = useState("");
	const [transferDate, setTransferDate] = useState("");

	// Cheque fields
	const [chequeNo, setChequeNo] = useState("");
	const [chequeBank, setChequeBank] = useState("");
	const [chequeDate, setChequeDate] = useState("");

	const amountInvalid = useMemo(() => {
		return !amount || Number.isNaN(Number(amount)) || Number(amount) <= 0;
	}, [amount]);

	const onlineInvalids = useMemo(() => ({
		bankName: mode === "online" && !bankName,
		referenceNo: mode === "online" && !referenceNo,
		transferDate: mode === "online" && !transferDate,
	}), [mode, bankName, referenceNo, transferDate]);

	const chequeInvalids = useMemo(() => ({
		chequeNo: mode === "cheque" && !chequeNo,
		chequeBank: mode === "cheque" && !chequeBank,
		chequeDate: mode === "cheque" && !chequeDate,
	}), [mode, chequeNo, chequeBank, chequeDate]);

	const isValid = useMemo(() => {
		if (amountInvalid) return false;
		if (mode === "online") return Boolean(bankName && referenceNo && transferDate);
		if (mode === "cheque") return Boolean(chequeNo && chequeBank && chequeDate);
		return true; // cash only requires amount
	}, [amountInvalid, mode, bankName, referenceNo, transferDate, chequeNo, chequeBank, chequeDate]);

	const handleSetPayment = () => {
		// Mark that the user attempted to submit so messages become visible
		setShowErrors(true);

		// Block submission if invalid
		if (!isValid) return;

		const payload = {
			mode,
			amount: Number(amount),
			note: note?.trim() || undefined,
			...(mode === "online"
				? { bankName: bankName?.trim(), referenceNo: referenceNo?.trim(), transferDate }
				: {}),
			...(mode === "cheque"
				? { chequeNo: chequeNo?.trim(), bankName: chequeBank?.trim(), chequeDate }
				: {}),
		};

		if (typeof onSetPayment === "function") {
			onSetPayment(payload);
			// Optionally reset showErrors after successful submit
			// setShowErrors(false);
		} else {
			// Fallback: log to console if no handler provided
			console.log("setPayment:", payload);
			// setShowErrors(false);
		}
	};

	// Section is defined at module scope to avoid re-creating the component
	// on every render. This prevents React from remounting children and
	// causing inputs to lose focus while typing.

	return (
		<div className="flex flex-col gap-3">
			<h3 className="m-0 text-lg font-semibold text-gray-900">Payment Mode</h3>

			{/* Mode selector */}
			<div
				role="group"
				aria-label="Select payment mode"
				className="flex flex-wrap items-center gap-4"
			>
				<label className="inline-flex items-center gap-2 cursor-pointer select-none">
					<input
						className="size-4 accent-blue-600"
						type="radio"
						name="payment-mode"
						value="cash"
						checked={mode === "cash"}
						onChange={() => setMode("cash")}
					/>
					<span className="text-sm text-gray-800">Cash</span>
				</label>
				<label className="inline-flex items-center gap-2 cursor-pointer select-none">
					<input
						className="size-4 accent-blue-600"
						type="radio"
						name="payment-mode"
						value="online"
						checked={mode === "online"}
						onChange={() => setMode("online")}
					/>
					<span className="text-sm text-gray-800">Online Transfer</span>
				</label>
				<label className="inline-flex items-center gap-2 cursor-pointer select-none">
					<input
						className="size-4 accent-blue-600"
						type="radio"
						name="payment-mode"
						value="cheque"
						checked={mode === "cheque"}
						onChange={() => setMode("cheque")}
					/>
					<span className="text-sm text-gray-800">Cheque</span>
				</label>
			</div>

			{/* Common amount & note */}
			<Section title="Common Details">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs text-gray-600 mb-1">Amount</label>
						<input
							type="number"
							min="0"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0.00"
							aria-invalid={amountInvalid}
							className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
								amountInvalid ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
							}`}
						/>
						{showErrors && amountInvalid ? (
							<p className="mt-1 text-xs text-red-600">Amount is required and must be greater than 0.</p>
						) : (
							<p className="mt-1 text-xs text-gray-500">Enter a positive amount</p>
						)}
					</div>
					<div>
						<label className="block text-xs text-gray-600 mb-1">Note (optional)</label>
						<input
							type="text"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Add a note"
							className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</Section>

			{mode === "cash" && (
				<Section title="Cash">
					<div className="text-sm text-gray-600">No additional details required for cash payments.</div>
				</Section>
			)}

			{mode === "online" && (
				<Section title="Online Transfer">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						<div>
							<label className="block text-xs text-gray-600 mb-1">Bank Name</label>
							<input
								type="text"
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
								placeholder="Enter bank"
								aria-invalid={onlineInvalids.bankName}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									onlineInvalids.bankName ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && onlineInvalids.bankName && (
								<p className="mt-1 text-xs text-red-600">Bank name is required.</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-gray-600 mb-1">Reference No.</label>
							<input
								type="text"
								value={referenceNo}
								onChange={(e) => setReferenceNo(e.target.value)}
								placeholder="Transaction reference"
								aria-invalid={onlineInvalids.referenceNo}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									onlineInvalids.referenceNo ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && onlineInvalids.referenceNo && (
								<p className="mt-1 text-xs text-red-600">Reference number is required.</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-gray-600 mb-1">Transfer Date</label>
							<input
								type="date"
								value={transferDate}
								onChange={(e) => setTransferDate(e.target.value)}
								aria-invalid={onlineInvalids.transferDate}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									onlineInvalids.transferDate ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && onlineInvalids.transferDate && (
								<p className="mt-1 text-xs text-red-600">Transfer date is required.</p>
							)}
						</div>
					</div>
				</Section>
			)}

			{mode === "cheque" && (
				<Section title="Cheque">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						<div>
							<label className="block text-xs text-gray-600 mb-1">Cheque No.</label>
							<input
								type="text"
								value={chequeNo}
								onChange={(e) => setChequeNo(e.target.value)}
								placeholder="Cheque number"
								aria-invalid={chequeInvalids.chequeNo}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									chequeInvalids.chequeNo ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && chequeInvalids.chequeNo && (
								<p className="mt-1 text-xs text-red-600">Cheque number is required.</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-gray-600 mb-1">Bank Name</label>
							<input
								type="text"
								value={chequeBank}
								onChange={(e) => setChequeBank(e.target.value)}
								placeholder="Bank name"
								aria-invalid={chequeInvalids.chequeBank}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									chequeInvalids.chequeBank ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && chequeInvalids.chequeBank && (
								<p className="mt-1 text-xs text-red-600">Bank name is required.</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-gray-600 mb-1">Cheque Date</label>
							<input
								type="date"
								value={chequeDate}
								onChange={(e) => setChequeDate(e.target.value)}
								aria-invalid={chequeInvalids.chequeDate}
								className={`w-full px-3 py-2 rounded-md border text-sm outline-none transition ${
									chequeInvalids.chequeDate ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500"
								}`}
							/>
							{showErrors && chequeInvalids.chequeDate && (
								<p className="mt-1 text-xs text-red-600">Cheque date is required.</p>
							)}
						</div>
					</div>
				</Section>
			)}

			<div className="flex justify-end mt-2">
				<button
					type="button"
					onClick={handleSetPayment}
					title={!isValid ? "Fill required fields" : undefined}
					className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
				>
					Set Payment
				</button>
			</div>
		</div>
	);
}

