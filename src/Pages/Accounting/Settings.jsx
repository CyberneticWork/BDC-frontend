import React from "react";

const Settings = () => {
  return (
    <div className="settings">
      <h1>Settings</h1>
      <p>Company info, currency, tax, preferences.</p>
      {/* Placeholder for settings */}
      <form>
        <label>
          Company Name: <input type="text" />
        </label>
        <label>
          Currency:{" "}
          <select>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </label>
        <label>
          Tax Rate: <input type="number" />
        </label>
        <button>Save</button>
      </form>
    </div>
  );
};

export default Settings;
