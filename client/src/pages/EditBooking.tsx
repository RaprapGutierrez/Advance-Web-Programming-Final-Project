import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { Async, PageHeader } from '../components/ui';
import BookingForm from '../components/BookingForm';
import type { Booking } from '../types';

export default function EditBooking() {
  const { id } = useParams();
  const b = useFetch<Booking>(`/bookings/${id}`);
  return (
    <>
      <PageHeader title="Edit booking" subtitle="Only pending or confirmed bookings can change." />
      <Async loading={b.loading} error={b.error} retry={b.refetch}>{b.data && <BookingForm key={b.data.id} initial={b.data} />}</Async>
    </>
  );
}
