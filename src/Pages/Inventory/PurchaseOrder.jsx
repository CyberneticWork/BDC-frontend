import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addPurchaseOrder, getPurchaseOrders, getCenters, getProducts } from "../../services/Inventory/inventoryService";  //get from dummy data inventoryService.js

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
	const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
		const [errors, setErrors] = useState({});

		// Typeahead state for products
		const [showSuggestions, setShowSuggestions] = useState(false);
		const [activeIndex, setActiveIndex] = useState(-1);
		const productInputRef = useRef(null);

		useEffect(() => {
			setForm((p) => ({ ...p, orderNumber: nextPONumber }));
		}, [nextPONumber]);


			// Centers from service
			const centers = useMemo(() => getCenters() || [], []);

			// Products for suggestions
			const products = useMemo(() => getProducts() || [], []);

			const filteredProducts = useMemo(() => {
				const q = (entry.productName || "").toLowerCase().trim();
				if (!q) return products.slice(0, 8);
				return products
					.filter((p) =>
						(p.name || "").toLowerCase().includes(q) ||
						(p.sku || "").toLowerCase().includes(q)
					)
					.slice(0, 8);
			}, [entry.productName, products]);

		// Build supplier options from existing orders with fallback defaults
		const supplierOptions = useMemo(() => {
			const unique = Array.from(
				new Set((orders || []).map((o) => (o.supplier || "").trim()).filter(Boolean))
			);
			return unique.length
				? unique
				: ["Tech Supplies Ltd", "Office Equipment Co", "Acme Traders", "Global Suppliers"];
		}, [orders]);

		// Helper to parse discount as amount or % against a base
		const parseDiscount = (input, base) => {
			const s = String(input || "").trim();
			if (!s) return 0;
			if (s.endsWith("%")) {
				const pct = parseFloat(s.slice(0, -1));
				if (!isFinite(pct) || pct <= 0) return 0;
				return Math.min(base, (base * pct) / 100);
			}
			const amt = parseFloat(s);
			if (!isFinite(amt) || amt <= 0) return 0;
			return Math.min(base, amt);
		};

		// Aggregate totals based on per-line discounts
		const { subtotal, discountTotal } = useMemo(() => {
			let sub = 0;
			let disc = 0;
			for (const it of items) {
				const qty = Number(it.quantity) || 0;
				const price = Number(it.unitPrice) || 0;
				const gross = qty * price;
				const dAmt = parseDiscount(it.discountInput, gross);
				disc += dAmt;
				sub += Math.max(0, gross - dAmt);
			}
			return { subtotal: sub, discountTotal: disc };
		}, [items]);

		const tax = useMemo(() => {
			// Simple 10% tax demo on net subtotal
			return (subtotal || 0) * 0.1;
		}, [subtotal]);

		const totalAmount = useMemo(() => Math.max(0, subtotal) + tax, [subtotal, tax]);

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
			const selected = entry.productId ? products.find((p) => String(p.id) === String(entry.productId)) : products.find((p) => (p.name || "").toLowerCase() === name.toLowerCase());
			const qty = Math.max(1, Number(entry.quantity) || 1);
			const unitPrice = selected ? Number(selected.unitPrice) || 0 : Number(entry.unitPrice) || 0;
			const currentStock = selected ? Number(selected.currentstock) || 0 : 0;
			const mrp = selected ? Number(selected.mrp) || 0 : 0;
			const e = {};
			if (!name) e.productName = "Product name is required";
			if (unitPrice < 0) e.unitPrice = "Unit price cannot be negative";
			setErrors((prev) => ({ ...prev, ...e }));
			if (Object.keys(e).length) return;
			// Ensure unit price does not exceed MRP at the time of adding
			const clampedUnitPrice = mrp > 0 ? Math.min(unitPrice, mrp) : Math.max(0, unitPrice);
			const attemptedOverMrp = mrp > 0 && unitPrice > mrp;
			setItems((prev) => [
				...prev,
				{
					id: Date.now() + Math.floor(Math.random() * 1000),
					productId: selected ? selected.id : undefined,
					productName: name,
					quantity: qty,
					unitPrice: clampedUnitPrice,
					currentStock,
					mrp,
					discountInput: "",
					attemptedOverMrp,
				},
			]);
			setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
		};

		const updateItem = (id, field, rawValue) => {
			setItems((prev) =>
				prev.map((it) => {
					if (it.id !== id) return it;
					if (field === "discountInput") {
						return { ...it, discountInput: String(rawValue || "") };
					}
					const num = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
					if (field === "quantity") return { ...it, quantity: Math.max(1, Math.floor(num)) };
					// Prevent unit price from exceeding MRP and flag a visible message
					if (field === "unitPrice") {
						const mrp = Number(it.mrp) || 0;
						const clamped = Math.max(0, num);
						if (mrp > 0 && clamped > mrp) {
							return { ...it, unitPrice: mrp, attemptedOverMrp: true };
						}
						return { ...it, unitPrice: clamped, attemptedOverMrp: false };
					}
					return it;
				})
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
						items: items.map((it) => {
							const qty = Number(it.quantity) || 0;
							const price = Number(it.unitPrice) || 0;
							const gross = qty * price;
							const dAmt = parseDiscount(it.discountInput, gross);
							return {
								...it,
								lineGross: gross,
								lineDiscountInput: it.discountInput || "",
								lineDiscountAmount: dAmt,
								lineNet: Math.max(0, gross - dAmt),
							};
						}),
						subtotal,
						discountTotal,
						tax,
						totalAmount,
				};
				const created = addPurchaseOrder(payload);
				setOrders((prev) => [...prev, created]);
				// Reset
				setForm({ orderNumber: "", center: "", supplier: "", date: new Date().toISOString().split("T")[0], status: "Draft", refNumber: "" });
				setItems([]);
				setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
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
								<p className="text-[35px] font-medium">{formatLKR(subtotal)}</p>
							</div>
						</div>

						{/* Items entry section */}

						<div className="mb-4 sm:mb-6">
							<h4 className="text-base sm:text-lg font-medium text-gray-900 mb-4"> Add Items</h4>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div className="sm:col-span-3">
									<label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
									<div className="relative" onKeyDown={(e) => {
										if (!showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
											setShowSuggestions(true);
											return;
										}
										if (!showSuggestions) return;
										if (e.key === "ArrowDown") {
											e.preventDefault();
											setActiveIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
										} else if (e.key === "ArrowUp") {
											e.preventDefault();
											setActiveIndex((prev) => Math.max(prev - 1, 0));
										} else if (e.key === "Enter") {
											e.preventDefault();
											if (activeIndex >= 0 && filteredProducts[activeIndex]) {
												const p = filteredProducts[activeIndex];
												setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
												setShowSuggestions(false);
												setActiveIndex(-1);
											}
										} else if (e.key === "Escape") {
											setShowSuggestions(false);
											setActiveIndex(-1);
										}
									}}>
										<input
											ref={productInputRef}
											type="text"
											value={entry.productName}
											onFocus={() => setShowSuggestions(true)}
											onChange={(e) => {
												const val = e.target.value;
												setEntry((p) => ({ ...p, productId: "", productName: val }));
												setShowSuggestions(true);
												setActiveIndex(-1);
											}}
											onBlur={() => {
												// Delay hiding to allow click selection
												setTimeout(() => setShowSuggestions(false), 150);
											}}
											className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.productName ? "border-red-500" : "border-gray-300"}`}
											placeholder="Type to search product (name or SKU)"
										/>
										{showSuggestions && filteredProducts.length > 0 && (
											<ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
												{filteredProducts.map((p, idx) => (
													<li
														key={p.id}
														className={`px-3 py-2 cursor-pointer flex justify-between items-center ${idx === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"}`}
														onMouseEnter={() => setActiveIndex(idx)}
														onMouseDown={(e) => e.preventDefault()}
														onClick={() => {
															setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
															setShowSuggestions(false);
															setActiveIndex(-1);
															productInputRef.current?.blur();
														}}
													>
														<span className="text-sm text-gray-900">{p.name}</span>
														<span className="ml-2 text-xs text-gray-500">{p.sku}</span>
														<span className="ml-auto text-xs text-gray-600">LKR {Number(p.unitPrice || 0).toFixed(2)} • MRP {Number(p.mrp || 0).toFixed(2)} • Stock {p.currentstock}</span>
													</li>
												))}
											</ul>
										)}
									</div>
									{errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
								</div>

                                      {/* Add Item Button */}
								<div className="flex items-end">
									<button
										type="button"
										onClick={addItem}
										className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
										<Plus className="h-4 w-4" />
										Add Item
									</button>
								</div>
							</div>
						</div>


						{items.length > 0 && (
								<div className="mt-4 overflow-x-auto">
									<div className="inline-block min-w-full align-middle">
										<div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
											<table className="min-w-[880px] w-full divide-y divide-gray-200">
												<thead className="bg-gray-50 sticky top-0 z-10">
													<tr>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
														<th className="px-3 sm:px-4 py-2 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">MRP</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
														<th className="px-3 sm:px-4 py-2 text-right text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
														<th className="px-2 sm:px-3 py-2 text-right">Action</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-100">
													{items.map((it, idx) => {
														const rowQty = Number(it.quantity) || 0;
														const rowPrice = Number(it.unitPrice) || 0;
														const rowGross = rowQty * rowPrice;
														const rowDiscount = parseDiscount(it.discountInput, rowGross);
														const rowTotal = Math.max(0, rowGross - rowDiscount);
														return (
															<tr key={it.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
																<td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{idx + 1}</td>
																<td className="px-3 sm:px-4 py-2 text-sm text-gray-900">{it.productName}</td>
																<td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
																	{/*unit price cannot exceep MRP message */}
																	<div className="flex flex-col items-end">
																		<input
																			type="number"
																			min="0"
																			step="0.01"
																			value={it.unitPrice}
																			onChange={(e) => updateItem(it.id, "unitPrice", e.target.value)}
																			className={`w-28 px-2 py-1 border rounded-md text-right focus:outline-none focus:ring-2 ${it?.attemptedOverMrp ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}`}
																		/>
																		{it?.attemptedOverMrp && (
																			<p className="mt-1 text-xs text-red-600">Unit price cannot exceed MRP ({formatLKR(it.mrp || 0)})</p>
																		)}
																	</div>
																</td>
																<td className="px-3 sm:px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{it.currentStock}</td>
																<td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
																	<input
																		type="number"
																		min="1"
																		value={it.quantity}
																		onChange={(e) => updateItem(it.id, "quantity", e.target.value)}
																		className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																	/>
																</td>
																<td className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-900 text-right whitespace-nowrap">{formatLKR(it.mrp || 0)}</td>
																<td className="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
																	<input
																		type="text"
																		value={it.discountInput || ""}
																		onChange={(e) => updateItem(it.id, "discountInput", e.target.value)}
																		placeholder="0 or 10%"
																		className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

													{/* Summary rows intentionally removed as requested */}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

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

