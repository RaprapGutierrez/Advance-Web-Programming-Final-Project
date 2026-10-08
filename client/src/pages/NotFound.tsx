import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return <Empty title="Page not found" hint="That address doesn't match anything in StudioSpace." action={<Link to="/" className="btn btn-primary">Back to home</Link>} />;
}
