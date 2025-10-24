import React, { useState } from "react";

const DiscountLevel = () => {
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
		if (isEditing) {
			setDiscountLevels(discountLevels.map(level => level.id === editingLevel.id ? { ...formData, id: editingLevel.id } : level));
			setIsEditing(false);
			setEditingLevel(null);
		} else {
			setDiscountLevels([...discountLevels, { ...formData, id: Date.now() }]);
		}
		setFormData({ name: "", date: "", days: "", description: "", value: "" });
		setShowForm(false);
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleDelete = (id) => {
		setDiscountLevels(discountLevels.filter((level) => level.id !== id));
	};

	const handleEdit = (level) => {
		setIsEditing(true);
		setEditingLevel(level);
		setFormData({ ...level });
		setShowForm(true);
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-semibold text-gray-800">Discount Level</h1>
				<button
					onClick={() => setShowForm(!showForm)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition duration-200"
				>
					Create Discount Level
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
									<label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
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
									className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition duration-200"
								>
									{isEditing ? "Update" : "Create"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-800">Created Discount Levels</h2>
					<input
						type="text"
						placeholder="Search discount levels..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
					/>
				</div>
				{discountLevels.length === 0 ? (
					<p className="text-gray-600">No discount levels created yet.</p>
				) : (
					<div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
						<table className="w-full table-auto border-collapse">
							<thead className="bg-gradient-to-r from-gray-50 to-gray-100">
								<tr>
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
									.filter((level) =>
										level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
										level.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
										level.days.toString().includes(searchTerm) ||
										level.value.toString().includes(searchTerm)
									)
									.map((level, index) => (
										<tr key={level.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
											<td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{level.name}</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700">{level.date}</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700">{level.days}</td>
											<td className="px-6 py-4 text-gray-700 max-w-xs truncate">{level.description}</td>
											<td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">{level.value}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex space-x-3">
													<button
														onClick={() => handleEdit(level)}
														className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
													>
														Edit
													</button>
													<button
														onClick={() => handleDelete(level.id)}
														className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
													>
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