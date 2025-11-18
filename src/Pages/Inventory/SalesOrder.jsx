import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle, X } from "lucide-react";
import { addSalesOrder, getSalesOrders } from "../../services/AccountingService";
import { getCenters as getStaticCenters, getProducts as getStaticProducts } from "../../services/Inventory/inventoryService";
import { fetchCenters as fetchCentersService } from "../../services/Inventory/centerService";
import { getCustomers as fetchCustomersService } from "../../services/Account/CustomerService";
import { getAll as fetchProductsService } from "../../services/Inventory/productListService";

const SalesOrder = () => {
	const [orders, setOrders] = useState([]);
	const [nextSONumber, setNextSONumber] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [successText, setSuccessText] = useState("");

	useEffect(() => {
		const initial = getSalesOrders();
		setOrders(initial);
	}, []);

	useEffect(() => {
		// Compute next SO number from existing orders; accept with/without dash and preserve higher current state
		const nums = orders
			.map((o) => {
				const m = String(o.orderNumber || "").match(/^SO-?(\d+)$/i);
				return m ? parseInt(m[1], 10) : null;
			})
			.filter((n) => n !== null);
		const fromOrders = nums.length ? Math.max(...nums) + 1 : 1;
		setNextSONumber((prev) => {
			const pm = String(prev || "").match(/^SO-?(\d+)$/i);
			const prevNum = pm ? parseInt(pm[1], 10) : 0;
			const finalNum = Math.max(fromOrders, prevNum || 0);
			return `SO-${String(finalNum).padStart(4, "0")}`;
		});
	}, [orders]);

    // Success modal stays until user dismisses; no auto-hide

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

	const InlinePOForm = ({ nextSONumber }) => {
		const [form, setForm] = useState({
			orderNumber: "",
			center: "",
			customer: "",
			date: new Date().toISOString().split("T")[0],
			status: "Draft",
			refNumber: "",
		});
	const [items, setItems] = useState([]);
	const [entry, setEntry] = useState({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
		const [errors, setErrors] = useState({});
		const [customers, setCustomers] = useState([]);
		const [centers, setCenters] = useState(() => getStaticCenters() || []);
		const [products, setProducts] = useState(() => getStaticProducts() || []);

		// Typeahead state for products
		const [showSuggestions, setShowSuggestions] = useState(false);
		const [activeIndex, setActiveIndex] = useState(-1);
		const productInputRef = useRef(null);

		useEffect(() => {
			setForm((p) => ({ ...p, orderNumber: nextSONumber }));
		}, [nextSONumber]);

		useEffect(() => {
			let active = true;
			const loadCustomers = async () => {
				try {
					const data = await fetchCustomersService();
					if (!active) return;
					const normalized = Array.isArray(data)
						? data.map((c) => ({
							id: c.id ?? c.customer_id ?? c.email ?? c.name,
							name: c.name ?? c.customer_name ?? `${c.first_name || ""} ${c.last_name || ""}`.trim(),
							email: c.email ?? c.contact_email ?? "",
						}))
						: [];
					setCustomers(normalized.filter((c) => c.name));
				} catch (error) {
					console.error("Error fetching customers:", error);
				}
			};
			loadCustomers();
			return () => {
				active = false;
			};
		}, []);

		useEffect(() => {
			let active = true;
			const loadCenters = async () => {
				try {
					const data = await fetchCentersService();
					if (!active) return;
					const normalized = Array.isArray(data)
						? data
							.map((c) => c.name ?? c.center_name ?? c.title ?? c.value ?? (typeof c === "string" ? c : ""))
							.filter(Boolean)
						: [];
					if (normalized.length) {
						setCenters(normalized);
					}
				} catch (error) {
					console.error("Error fetching centers:", error);
				}
			};
			loadCenters();
			return () => {
				active = false;
			};
		}, []);

		useEffect(() => {
			let active = true;
			const loadProducts = async () => {
				try {
					const data = await fetchProductsService();
					if (!active) return;
					const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
					if (!list.length) {
						setProducts(getStaticProducts() || []);
						return;
					}
					const normalized = list.map((p, idx) => ({
						id: p.id ?? p.product_id ?? p.sku ?? p.code ?? `INV-P-${idx}`,
						name: p.name ?? p.product_name ?? p.title ?? `Product ${idx + 1}`,
						sku: p.sku ?? p.code ?? p.product_code ?? "",
						unitPrice: Number(p.unitPrice ?? p.price ?? p.unit_price ?? p.selling_price ?? 0),
						mrp: Number(p.mrp ?? p.mrp_price ?? p.retail_price ?? p.price ?? 0),
						currentstock: Number(p.currentstock ?? p.currentStock ?? p.stock ?? p.qty ?? 0),
					}));
					setProducts(normalized);
				} catch (error) {
					console.error("Error fetching products:", error);
					setProducts(getStaticProducts() || []);
				}
			};
			loadProducts();
			return () => {
				active = false;
			};
		}, []);

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

		// Build customer options from inventory service customers
		const customerOptions = useMemo(() => {
			return customers.map(c => c.name).filter(Boolean);
		}, [customers]);

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
				const dAmt = it.discountEnabled ? parseDiscount(it.discountInput, gross) : 0;
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


    //*error messages
		const validate = () => {
			const e = {};
			if (!form.orderNumber) e.orderNumber = "SO number not generated";
			if (!form.center.trim()) e.center = "Center is required";
			if (!form.customer?.trim()) e.customer = "Customer is required";
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
			setItems((prev) => [
				...prev,
				{
					id: Date.now() + Math.floor(Math.random() * 1000),
					productId: selected ? selected.id : undefined,
					productName: name,
					quantity: qty,
					unitPrice: Math.max(0, unitPrice),
					currentStock,
					mrp,
					discountEnabled: false,
					discountInput: "",
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
					if (field === "unitPrice") {
						return { ...it, unitPrice: Math.max(0, num) };
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
								const dAmt = it.discountEnabled ? parseDiscount(it.discountInput, gross) : 0;
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
				console.log("Sales order payload:", payload);
				const created = addSalesOrder(payload);
				setOrders((prev) => [...prev, created]);
				// Show success toast
				const createdNumber = created?.orderNumber || nextSONumber;
				setSuccessText(`Sales order ${createdNumber} created successfully.`);
				setShowSuccess(true);
				// Immediately bump displayed next SO number
				const m = String(createdNumber).match(/^SO-?(\d+)$/i);
				if (m) {
					const nextNum = Number(m[1]) + 1;
					setNextSONumber(`SO-${String(nextNum).padStart(4, "0")}`);
				}
				// Reset
				setForm({ orderNumber: "", center: "", customer: "", date: new Date().toISOString().split("T")[0], status: "Draft", refNumber: "" });
				setItems([]);
				setEntry({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
				setErrors({});
			} finally {
				setIsSubmitting(false);
			}
		};

		return (
			<>
				<div className="bg-slate-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase">Sales Order Management</h1>
							<div className="text-blue-600 font-semibold mt-2 text-lg sm:text-xl">Order ID: {nextSONumber}</div>
							<p className="text-slate-600 mt-2 text-sm sm:text-base">Efficiently manage and track your sales orders across centers</p>
						</div>
					</div>
				</div>
				{/* No inline message when using popup */}
				<div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 border border-slate-200">
					<form onSubmit={onSubmit}>
						<div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
								<div className="space-y-2">
									<label className="block text-sm font-semibold text-slate-700 mb-2">Order Date *</label>
									<input
										type="date"
										value={form.date}
										onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
										className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.date ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
									/>
									{errors.date && <p className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>}
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-semibold text-slate-700 mb-2">Center *</label>
									<select
										value={form.center}
										onChange={(e) => setForm((p) => ({ ...p, center: e.target.value }))}
										className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.center ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
									>
										<option value="">Select a center</option>
										{centers.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
									{errors.center && <p className="text-red-600 text-sm mt-1 font-medium">{errors.center}</p>}
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-semibold text-slate-700 mb-2">Customer Information *</label>
									<select
										value={form.customer}
										onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))}
										className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.customer ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
									>
										<option value="">Select customer</option>
										{customerOptions.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
									{errors.customer && <p className="text-red-600 text-sm mt-1 font-medium">{errors.customer}</p>}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
								<div className="space-y-2">
									<label className="block text-sm font-semibold text-slate-700 mb-2">Reference Number</label>
									<input
										type="text"
										value={form.refNumber}
										onChange={(e) => setForm((p) => ({ ...p, refNumber: e.target.value }))}
										placeholder="Enter reference number"
										className="w-full px-4 py-3 border-2 border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-colors"
									/>
								</div>
								<div className="lg:place-self-end pr-65 text-center bg-slate-100 rounded-lg p-4 border border-slate-200">
									<p className="text-lg font-semibold text-slate-700">Total Amount</p>
									<p className="text-3xl font-bold text-slate-900">{formatLKR(subtotal)}</p>
								</div>
							</div>

							{/* Items entry section */}

							<div className="mb-6 sm:mb-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
								<h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-4">Add Items</h4>
								<div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
									<div className="sm:col-span-3 space-y-2">
										<label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
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
												className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.productName ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"}`}
												placeholder="Search product by name or SKU"
											/>
											{showSuggestions && filteredProducts.length > 0 && (
												<ul className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg border-2 border-slate-200 bg-white shadow-xl">
													{filteredProducts.map((p, idx) => (
														<li
															key={p.id}
															className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-b-0 ${idx === activeIndex ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"}`}
															onMouseEnter={() => setActiveIndex(idx)}
															onMouseDown={(e) => e.preventDefault()}
															onClick={() => {
																setEntry({ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.unitPrice) || 0 });
																setShowSuggestions(false);
																setActiveIndex(-1);
																productInputRef.current?.blur();
															}}
														>
															<span className="text-sm font-medium text-slate-900">{p.name}</span>
															<span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.sku}</span>
															<span className="ml-auto text-xs text-slate-600 font-semibold">LKR {Number(p.unitPrice || 0).toFixed(2)} • MRP {Number(p.mrp || 0).toFixed(2)} • Stock {p.currentstock}</span>
														</li>
													))}
												</ul>
											)}
										</div>
										{errors.productName && <p className="text-red-600 text-sm mt-1 font-medium">{errors.productName}</p>}
									</div>

									{/* Add Item Button */}
									<div className="flex items-end">
										<button
											type="button"
											onClick={addItem}
											className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md">
											<Plus className="h-5 w-5" />
											Add Item
										</button>
									</div>
								</div>
							</div>


							{items.length > 0 && (
									<div className="mt-6 overflow-x-auto">
										<div className="inline-block min-w-full align-middle">
											<div className="overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm">
												<table className="min-w-[880px] w-full divide-y divide-slate-200">
													<thead className="bg-slate-100 sticky top-0 z-10">
														<tr>
															<th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">No</th>
															<th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Product Name</th>
															<th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Price</th>
															<th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Current Stock</th>
															<th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
															<th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">MRP</th>
															<th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider" title="Enable per-row discount">Disc On?</th>
															<th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Discount</th>
															<th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
															<th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
														</tr>
													</thead>
													<tbody className="bg-white divide-y divide-slate-100">
														{items.map((it, idx) => {
															const rowQty = Number(it.quantity) || 0;
															const rowPrice = Number(it.unitPrice) || 0;
															const rowGross = rowQty * rowPrice;
															const rowDiscount = it.discountEnabled ? parseDiscount(it.discountInput, rowGross) : 0;
															const rowTotal = Math.max(0, rowGross - rowDiscount);
															return (
																<tr key={it.id} className="hover:bg-slate-50 transition-colors">
																	<td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{idx + 1}</td>
																	<td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-semibold">{it.productName}</td>
																	<td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
																		<input
																			type="number"
																			min="0"
																			step="0.01"
																			value={it.unitPrice}
																			onChange={(e) => updateItem(it.id, "unitPrice", e.target.value)}
																			className="w-28 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
																		/>
																	</td>
																	<td className="px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap font-medium">{it.currentStock}</td>
																	<td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
																		<input
																			type="number"
																			min="1"
																			value={it.quantity}
																			onChange={(e) => updateItem(it.id, "quantity", e.target.value)}
																			className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
																		/>
																	</td>
																	<td className="px-4 sm:px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatLKR(it.mrp || 0)}</td>
																	<td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
																		<button
																			type="button"
																			role="switch"
																			aria-checked={!!it.discountEnabled}
																			aria-disabled={it.discountEnabled}
																			disabled={it.discountEnabled}
																			onClick={() => {
																				if (it.discountEnabled) return; // one-time enable only
																				setItems((prev) => prev.map((row) => (
																					row.id === it.id ? { ...row, discountEnabled: true } : row
																				)));
																			}}
																			className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${it.discountEnabled ? 'bg-blue-600 opacity-60 cursor-not-allowed' : 'bg-slate-300 hover:bg-slate-400'}`}
																			title={it.discountEnabled ? 'Discount enabled (locked)' : 'Enable discount for this row'}
																		>
																			<span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${it.discountEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
																			<span className="sr-only">Toggle discount</span>
																		</button>
																	</td>
																	<td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
																		<input
																			type="text"
																			value={it.discountInput || ""}
																			onChange={(e) => updateItem(it.id, "discountInput", e.target.value)}
																			disabled={!it.discountEnabled}
																			title={!it.discountEnabled ? 'Enable discount in this row to edit' : undefined}
																			placeholder="0 or 10%"
																			className={`w-24 px-3 py-2 border-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 ${!it.discountEnabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300 bg-slate-50 hover:bg-white'}`}
																		/>
																	</td>
																	<td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{formatLKR(rowTotal)}</td>
																	<td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
																		<button
																			type="button"
																			onClick={() => removeItem(it.id)}
																			className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors border border-red-200 hover:border-red-600"
																		>
																			<Trash2 className="h-5 w-5" />
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

							<div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto"
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											Processing Order...
										</>
									) : (
										<>
											<Plus className="h-5 w-5" />
											Create Sales Order
										</>
									)}
								</button>
							</div>
						</div>
					</form>
				</div>
			</>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 md:p-8">
			<div className="max-w-7xl mx-auto">
				<section aria-label="Create new sales order">
					<InlinePOForm nextSONumber={nextSONumber} />
				</section>
			</div>

			{/* Loading overlay */}
			{isSubmitting && (
				<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="status" aria-live="polite">
					<div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 border border-slate-200">
						<div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
						<span className="text-slate-800 font-medium">Creating sales order…</span>
					</div>
				</div>
			)}

			{/* Success modal popup (visible until dismissed) */}
			{showSuccess && (
				<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Sales order created">
					<div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md border border-slate-200">
						<div className="flex items-start gap-4">
							<CheckCircle className="h-7 w-7 text-green-600 flex-shrink-0" />
							<div className="flex-1">
								<h3 className="text-xl font-semibold text-slate-900">Success</h3>
								<p className="mt-2 text-sm text-slate-700">{successText || "Sales order created successfully."}</p>
							</div>
							<button
								type="button"
								onClick={() => setShowSuccess(false)}
								className="ml-2 text-slate-500 hover:text-slate-700 transition-colors"
								aria-label="Close"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={() => setShowSuccess(false)}
								className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-semibold"
							>
								OK
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
		
	);

};

export default SalesOrder;

