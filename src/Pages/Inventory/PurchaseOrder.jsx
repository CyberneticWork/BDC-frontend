import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addPurchaseOrder, getPurchaseOrders, getCenters } from "../../services/Inventory/inventoryService";

const PurchaseOrder = () => {
	const [orders, setOrders] = useState([]);
	const [nextPONumber, setNextPONumber] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const initial = getPurchaseOrders();
		setOrders(initial);
	}, []);

	useEffect(() => {
		// Compute next PO number from existing orders using pattern PO-0001
		const nums = orders
			.map((o) => {
				const m = String(o.orderNumber || "").match(/^PO-(\d{4})$/i);
				return m ? parseInt(m[1], 10) : null;
			})
			.filter((n) => n !== null);
		const next = nums.length ? Math.max(...nums) + 1 : 1;
		setNextPONumber(`PO-${String(next).padStart(4, "0")}`);
	}, [orders]);

	// LKR formatter
	const formatLKR = (value) => {
		try {
			return new Intl.NumberFormat("en-LK", {
				style: "currency",
				currency: "LKR",
			}).format(Number(value || 0));
		} catch {
			const num = Number(value || 0).toFixed(2);
			return `LKR ${num}`;
		}
	};

	const InlinePOForm = ({ nextPONumber, orders }) => {
		const [form, setForm] = useState({
			orderNumber: "",
			center: "",
			supplier: "",
			date: new Date().toISOString().split("T")[0],
			status: "Draft",
			refNumber: "",
		});
		const [items, setItems] = useState([]);
		const [entry, setEntry] = useState({ productName: "", quantity: 0, unitPrice: 0 });
		const [errors, setErrors] = useState({});

		useEffect(() => {
			setForm((p) => ({ ...p, orderNumber: nextPONumber }));
		}, [nextPONumber]);


			// Centers from service
			const centers = useMemo(() => getCenters() || [], []);

		// Build supplier options from existing orders with fallback defaults
		const supplierOptions = useMemo(() => {
			const unique = Array.from(
				new Set((orders || []).map((o) => (o.supplier || "").trim()).filter(Boolean))
			);
			return unique.length
				? unique
				: ["Tech Supplies Ltd", "Office Equipment Co", "Acme Traders", "Global Suppliers"];
		}, [orders]);

		const subtotal = useMemo(() => {
			return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
		}, [items]);

		const tax = useMemo(() => {
			// Simple 10% tax demo
			return subtotal * 0.1;
		}, [subtotal]);

		const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

		const validate = () => {
			const e = {};
			if (!form.orderNumber) e.orderNumber = "PO number not generated";
			if (!form.center.trim()) e.center = "Center is required";
			if (!form.supplier.trim()) e.supplier = "Supplier is required";
			if (!form.date) e.date = "Date is required";
			if (items.length === 0) e.items = "Add at least one item";
			setErrors(e);
			return Object.keys(e).length === 0;
		};

		const addItem = () => {
			const name = (entry.productName || "").trim();
			const qty = Number(entry.quantity) || 0;
			const price = Number(entry.unitPrice) || 0;
			const e = {};
			if (!name) e.productName = "Product name is required";
			if (qty <= 0) e.quantity = "Quantity must be greater than 0";
			if (price < 0) e.unitPrice = "Unit price cannot be negative";
			setErrors((prev) => ({ ...prev, ...e }));
			if (Object.keys(e).length) return;
			setItems((prev) => [
				...prev,
				{ id: Date.now(), productName: name, quantity: qty, unitPrice: price, total: qty * price },
			]);
			setEntry({ productName: "", quantity: 0, unitPrice: 0 });
		};

		const updateItem = (id, field, value) => {
			setItems((prev) =>
				prev.map((it) =>
					it.id === id
						? { ...it, [field]: value, total: (field === "quantity" || field === "unitPrice") ? (Number(field === "quantity" ? value : it.quantity) || 0) * (Number(field === "unitPrice" ? value : it.unitPrice) || 0) : it.total }
						: it
				)
			);
		};

		const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

		const onSubmit = async (e) => {
			e.preventDefault();
			if (!validate()) return;
			setIsSubmitting(true);
			try {
				const payload = {
					...form,
					items,
					subtotal,
					tax,
					totalAmount,
				};
				const created = addPurchaseOrder(payload);
				setOrders((prev) => [...prev, created]);
				// Reset
				setForm({ orderNumber: "", center: "", supplier: "", date: new Date().toISOString().split("T")[0], status: "Draft", refNumber: "" });
				setItems([]);
				setEntry({ productName: "", quantity: 0, unitPrice: 0 });
				setErrors({});
			} finally {
				setIsSubmitting(false);
			}
		};

		return (
			<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
					<div>
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">PURCHASE ORDER</h1>
						<div className="text-red-600 font-bold mt-1 text-md sm:text-base">Purchase Order Number : {nextPONumber}</div>
						<p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage purchase orders</p>
					</div>
				</div>

				<form onSubmit={onSubmit}>
					<div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
								<input
									type="date"
									value={form.date}
									onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? "border-red-500" : "border-gray-300"}`}
								/>
								{errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Center *</label>
								<select
									value={form.center}
									onChange={(e) => setForm((p) => ({ ...p, center: e.target.value }))}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.center ? "border-red-500" : "border-gray-300"}`}
								>
									<option value="">Select a center</option>
									{centers.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>
								{errors.center && <p className="text-red-500 text-sm mt-1">{errors.center}</p>}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
								<select
									value={form.supplier}
									onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.supplier ? "border-red-500" : "border-gray-300"}`}
								>
									<option value="">Select supplier</option>
									{supplierOptions.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
								{errors.supplier && <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Ref Number</label>
								<input
									type="text"
									value={form.refNumber}
									onChange={(e) => setForm((p) => ({ ...p, refNumber: e.target.value }))}
									placeholder="Enter reference number"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div className="lg:place-self-end pr-65 text-center">
								<p className="text-[18px]">Total Amount</p>
								<p className="text-[35px] font-medium">{formatLKR(totalAmount)}</p>
							</div>
						</div>

						{/* Items entry section */}
            
						<div className="mb-4 sm:mb-6">
							<h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Items</h4>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
									<input
										type="text"
										value={entry.productName}
										onChange={(e) => setEntry((p) => ({ ...p, productName: e.target.value }))}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.productName ? "border-red-500" : "border-gray-300"}`}
										placeholder="Enter product name"
									/>
									{errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
									<input
										type="number"
										min="1"
										value={entry.quantity}
										onChange={(e) => setEntry((p) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.quantity ? "border-red-500" : "border-gray-300"}`}
										placeholder="Enter quantity"
									/>
									{errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Unit Price *</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={entry.unitPrice}
										onChange={(e) => setEntry((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.unitPrice ? "border-red-500" : "border-gray-300"}`}
										placeholder="Enter unit price"
									/>
									{errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
								</div>
								<div className="flex items-end">
									<button
										type="button"
										onClick={addItem}
										className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
									>
										<Plus className="h-4 w-4" />
										Add Item
									</button>
								</div>
							</div>

							{items.length > 0 && (
								<div className="mt-4 overflow-x-auto">
									<div className="inline-block min-w-full align-middle">
										<div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
											<table className="min-w-[760px] w-full divide-y divide-gray-200">
												<thead className="bg-gray-50 sticky top-0 z-10">
													<tr>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
														<th className="px-2 sm:px-3 py-2 text-right"></th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-100">
													{items.map((it, idx) => {
														const rowTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
														return (
															<tr key={it.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
																<td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{idx + 1}</td>
																<td className="px-3 sm:px-4 py-2 text-sm text-gray-900">{it.productName}</td>
																<td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
																	<input
																		type="number"
																		min="1"
																		value={it.quantity}
																		onChange={(e) => updateItem(it.id, "quantity", parseInt(e.target.value) || 0)}
																		className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																	/>
																</td>
																<td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
																	<input
																		type="number"
																		min="0"
																		step="0.01"
																		value={it.unitPrice}
																		onChange={(e) => updateItem(it.id, "unitPrice", parseFloat(e.target.value) || 0)}
																		className="w-28 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																	/>
																</td>
																<td className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td>
																<td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">
																	<button
																		type="button"
																		onClick={() => removeItem(it.id)}
																		className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
																	>
																		<Trash2 className="h-4 w-4" />
																	</button>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 w-full"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Creating...
									</>
								) : (
									<>
										<Plus className="h-4 w-4" />
										Create Purchase Order
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				<section aria-label="Create new purchase order">
					<InlinePOForm nextPONumber={nextPONumber} orders={orders} />
				</section>
			</div>
		</div>
	);
};

export default PurchaseOrder;

