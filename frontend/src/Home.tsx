import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Link } from "react-router";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center">
      <div className="pt-48">
        <div className="flex justify-center gap-4">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="h-16 w-16" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="h-16 w-16" alt="React logo" />
          </a>
        </div>
      </div>
      <h1 className="text-4xl font-bold">Vite + React</h1>
      <div>
        <button
          className="px-4 py-2 my-4 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p>
        Navigate to the{" "}
        <Link className="text-blue-500 hover:underline" to="/example">
          Example
        </Link>{" "}
        page.
      </p>
    </div>
  );
}

export default App;
