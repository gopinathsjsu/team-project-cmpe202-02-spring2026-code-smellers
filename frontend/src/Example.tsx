import { Link } from "react-router";

// sample page
// docs: https://reactrouter.com/start/declarative/navigating

function Example() {
  return (
    <>
      Hello from example! Return to{" "}
      <Link className="text-blue-500 hover:underline" to="/">
        home
      </Link>
      .
    </>
  );
}

export default Example;
