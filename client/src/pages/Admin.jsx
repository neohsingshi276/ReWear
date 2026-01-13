import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [view, setView] = useState(null);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-full border bg-white hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-10 mb-12">
        <button
          onClick={() => setView("pending")}
          className="w-64 p-6 bg-indigo-600 text-white rounded-xl shadow hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-2">Pending Listings</h3>
          <p className="text-sm opacity-90">
            Review items waiting for approval
          </p>
        </button>

        <button
          onClick={() => setView("users")}
          className="w-64 p-6 bg-emerald-600 text-white rounded-xl shadow hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-2">Users</h3>
          <p className="text-sm opacity-90">
            View user activity & history
          </p>
        </button>
      </div>

      {view === "pending" && <Pending />}
      {view === "users" && <Users />}
    </div>
  );
}

/* ================= Pending Listings ================= */

function Pending() {
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("/api/admin/pending-products", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setItems(res.data));
  }, []);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow text-gray-500">
        No pending products.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-xl font-semibold mb-4">Pending Listings</h2>

      <div className="space-y-4">
        {items.map(p => (
          <div
            key={p.id}
            className="flex items-center gap-6 border rounded-lg p-4"
          >
            <img
              src={p.image_url}
              className="w-28 h-28 object-cover rounded"
            />

            <div className="flex-1">
              <h4 className="font-semibold">{p.title}</h4>
              <p className="text-sm text-gray-500">
                Seller: {p.seller_name}
              </p>
              <p className="text-sm text-gray-500">
                AI Result: {p.ai_check_result}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await axios.put(
                    `/api/admin/products/${p.id}/approve`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  window.location.reload();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Approve
              </button>

              <button
                onClick={async () => {
                  await axios.put(
                    `/api/admin/products/${p.id}/reject`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Users ================= */

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [details, setDetails] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(res.data));
  }, []);

  const loadDetails = async (user) => {
    setSelectedUser(user);
    const res = await axios.get(
      `/api/admin/users/${user.id}/details`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setDetails(res.data);
  };

  return (
    <div className="mt-10 flex gap-8">
      {/* User list */}
      <div className="w-72">
        {users.map(u => (
          <div
            key={u.id}
            onClick={() => loadDetails(u)}
            className={`p-3 mb-2 rounded cursor-pointer border ${
              selectedUser?.id === u.id
                ? "bg-indigo-100"
                : "bg-white"
            }`}
          >
            <b>{u.username}</b>
            <div className="text-xs text-gray-500">{u.email}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      {details && (
        <div className="flex-1 space-y-6">
          <DetailSection
            title="Purchases"
            items={details.buying}
            render={b => `${b.title} — $${b.amount}`}
          />
          <DetailSection
            title="Sales"
            items={details.selling}
            render={s => `${s.title} — $${s.amount}`}
          />
          <DetailSection
            title="Exchanges"
            items={details.exchanges}
            render={e => `${e.requester_item} ↔ ${e.receiver_item}`}
          />
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, items, render }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="bg-white border rounded p-4">
        {items.length === 0
          ? "None"
          : items.map((i, idx) => (
              <div key={idx} className="text-sm mb-2">
                {render(i)}
                <div className="text-xs text-gray-400">
                  {new Date(i.created_at).toLocaleString()}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
