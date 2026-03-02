import { Link } from "react-router";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold">
          2077
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/register" className="hover:underline">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
