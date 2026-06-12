
import { Link } from "react-router-dom";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";

export default function NotFoundPage() {
  return (
    <main>
      <Container className="py-10">
        <EmptyState
          title="Page not found"
          text="The page you opened does not exist or has moved."
        />
        <div className="mt-4 text-center">
          <Link className="font-semibold text-[#4F8A5B]" to="/catalog">
            Open catalog
          </Link>
        </div>
      </Container>
    </main>
  );
}
