import PropertyForm from '@/app/admin/proprietes/PropertyForm';
export default function Page() { return <PropertyForm mode="create" apiBase="/api/agent/properties" showAdminOnly={false} />; }
