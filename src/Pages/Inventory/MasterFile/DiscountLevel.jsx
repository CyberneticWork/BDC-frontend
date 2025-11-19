import React, { useState, useEffect } from "react";
import discountLevelService from "../../../services/Inventory/discountLevelService";
import Swal from 'sweetalert2';

const DiscountLevel = () => {

	// Helper: format a value into YYYY-MM-DD for date input fields
	const formatDateForInput = (value) => {
		if (!value && value !== 0) return "";
		try {
			// If value already looks like YYYY-MM-DD, return it
			if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
			// If value contains a T (ISO datetime), take the left side
			if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
			const d = new Date(value);
			if (isNaN(d)) return String(value);
			const yyyy = d.getFullYear();
			const mm = String(d.getMonth() + 1).padStart(2, '0');
			const dd = String(d.getDate()).padStart(2, '0');
			return `${yyyy}-${mm}-${dd}`;
		} catch {
			return String(value);
		}
	};

	// Helper: display date without time in table (localized if possible)
	const formatDateDisplay = (value) => {
		if (!value && value !== 0) return "";
		try {
			// If it's an ISO-like string, extract date part first
			if (typeof value === 'string' && value.includes('T')) value = value.split('T')[0];
			const input = formatDateForInput(value);
			// show localized date if possible
			const d = new Date(input);
			if (!isNaN(d)) return d.toLocaleDateString();
			return input;
		} catch {
			return String(value);
		}
	};

	const [discountLevels, setDiscountLevels] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		date: "",
		days: "",
		description: "",
		value: "",
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		// perform a single awaited async flow so callers can rely on state updates
		const submit = async () => {
			setIsLoading(true);
			try {
				// coerce numeric fields to proper types before sending
				const payload = {
					...formData,
					days: formData.days === "" ? null : Number(formData.days),
					value: formData.value === "" ? null : Number(formData.value),
				};
				let result;
				if (isEditing && editingLevel) {
					// update existing
					result = await discountLevelService.update(editingLevel.id, payload);
					setIsEditing(false);
					setEditingLevel(null);
				} else {
					// create new
					result = await discountLevelService.create(payload);
				}
				// helpful debug: log server response (frontend dev can remove later)
				console.debug("Discount level saved:", result);
				// refresh list from server
				await loadDiscountLevels();
				setFormData({ name: "", date: "", days: "", description: "", value: "" });
				setShowForm(false);
				// minimal user feedback — consider replacing with a toast
				alert("Discount level saved successfully.");
			} catch (error) {
				console.error("Error saving discount level:", error);
				// show validation/errors to user where possible
				const message = (error && error.response && error.response.data && error.response.data.message) || error.message || "Failed to save discount level.";
				alert(message);
			} finally {
				setIsLoading(false);
			}
		};
		submit();
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleDelete = (id) => {
		const removeItem = async () => {
			if (!window.confirm("Are you sure you want to delete this discount level?")) return;
			try {
				await discountLevelService.remove(id);
				// refresh list
				await loadDiscountLevels();
			} catch (error) {
				console.error("Error deleting discount level:", error);
				alert("Failed to delete discount level. See console for details.");
			}
		};
		removeItem();
	};

	const handleEdit = (level) => {
		setIsEditing(true);
		setEditingLevel(level);
		setFormData({ ...level, date: formatDateForInput(level?.date) });
		setShowForm(true);
	};

	// load from API
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const loadDiscountLevels = async (params = {}) => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await discountLevelService.getAll(params);
			// debug: show raw API/service response to help diagnose why list may be empty
			console.debug("DiscountLevel: raw response from service:", res);
			// service may return either an array of items or an object with { data: [...] }
			let items = [];
			if (Array.isArray(res)) {
				items = res;
			} else if (Array.isArray(res?.data)) {
				items = res.data;
			} else if (Array.isArray(res?.data?.data)) {
				items = res.data.data;
			} else {
				// fallback: attempt to coerce single item/object into array if relevant
				if (res && typeof res === 'object' && Object.keys(res).length > 0) {
					// if the backend returned an object that isn't wrapped, try using it directly
					items = res.data ?? res;
				}
			}
			// ensure we always set an array and log parsed items
			console.debug("DiscountLevel: parsed items:", items);
			setDiscountLevels(Array.isArray(items) ? items : []);
		} catch (err) {
			console.error("Failed to load discount levels:", err);
			setError(err);
			setDiscountLevels([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadDiscountLevels();
	}, []);

	return (
		<div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-4xl font-bold text-gray-800">Discount Level</h1>
				<button
					onClick={() => setShowForm(!showForm)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition duration-200"
				>
					+ Create Discount Level
				</button>
			</div>

			{showForm && (
				<div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-4 border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold text-gray-800">{isEditing ? "Edit Discount Level" : "Create New Discount Level"}</h2>
							<button
								onClick={() => {
									setShowForm(false);
									setIsEditing(false);
									setEditingLevel(null);
									setFormData({ name: "", date: "", days: "", description: "", value: "" });
								}}
								className="text-gray-500 hover:text-gray-700 text-xl font-bold"
							>
								&times;
							</button>
						</div>
						<form onSubmit={handleSubmit}>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Discount Level Name</label>
									<input
										name="name"
										value={formData.name}
										onChange={handleChange}
										placeholder="Enter discount level name"
										className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
									<input
										name="date"
										type="date"
										value={formData.date}
										onChange={handleChange}
										className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
									<input
										name="days"
										type="number"
										value={formData.days}
										onChange={handleChange}
										placeholder="Enter number of days"
										className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
								<div>
									<label className="block  text-sm font-medium text-gray-700 mb-1">Discount Value</label>
									<input
										name="value"
										type="number"
										step="0.01"
										value={formData.value}
										onChange={handleChange}
										placeholder="Enter discount value"
										className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleChange}
									placeholder="Enter description or notes"
									className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									rows="3"
								></textarea>
							</div>
							<div className="flex justify-end">
								<button
									type="button"
									onClick={() => {
										setShowForm(false);
										setIsEditing(false);
										setEditingLevel(null);
										setFormData({ name: "", date: "", days: "", description: "", value: "" });
									}}
									className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isLoading}
									className={`px-6 py-2 rounded-md font-medium transition duration-200 text-white ${isLoading ? 'bg-green-400 cursor-not-allowed opacity-80' : 'bg-green-600 hover:bg-green-700'}`}
								>
									{isLoading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update' : 'Create'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-800"> Created Discount Levels</h2>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							placeholder="Search discount levels..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
						/>
					</div>
				</div>
				{isLoading ? (
					<p className="text-gray-600">Loading discount levels...</p>
				) : error ? (
					<p className="text-red-600">Failed to load discount levels.</p>
				) : discountLevels.length === 0 ? (
					<p className="text-gray-600">No discount levels created yet.</p>
				) : (
					<div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
						<table className="w-full table-auto border-collapse">
							<thead className="bg-gradient-to-r from-gray-50 to-gray-100">
								<tr>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">ID</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Name</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Date</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Days</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Description</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Value</th>
									<th className="border-b border-gray-300 px-6 py-4 text-left font-bold text-gray-800 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{discountLevels
									.filter((level) => {
										const term = searchTerm.toLowerCase();
										const id = level?.id != null ? String(level.id) : "";
										const name = (level?.name || "").toString().toLowerCase();
										const description = (level?.description || "").toString().toLowerCase();
										const days = level?.days != null ? String(level.days) : "";
										const value = level?.value != null ? String(level.value) : "";
										return (
											id.includes(term) ||
											name.includes(term) ||
											description.includes(term) ||
											days.includes(searchTerm) ||
											value.includes(searchTerm)
										);
									})
									.map((level, index) => (
										<tr key={level.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
											<td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{level.id}</td>
											<td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{level.name}</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatDateDisplay(level.date)}</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700">{level.days}</td>
											<td className="px-6 py-4 text-gray-700 max-w-xs">
												<div className="flex items-center justify-between">
													<span className="truncate flex-1">{level.description ?? ''}</span>
													<button onClick={() => Swal.fire({ title: 'Description', text: level.description || 'No description available', confirmButtonText: 'Close', width: '400px' })} className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0">
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													</button>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{level.value ?? ''}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex space-x-3">
													<button
															onClick={() => handleEdit(level)}
															className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
														>
															<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
															Edit
														</button>
														<button
															onClick={() => handleDelete(level.id)}
															className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
														>
															<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
															Delete
														</button>
												</div>
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default DiscountLevel;