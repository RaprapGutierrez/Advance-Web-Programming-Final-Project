import BookingForm from '../components/BookingForm';
import { PageHeader } from '../components/ui';

export default function NewBooking() {
  return (<><PageHeader title="New booking" subtitle="The price and any clash show up as you fill it in." /><BookingForm /></>);
}
