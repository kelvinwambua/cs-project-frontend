import { DeliveriesTable } from "./delivery-table"

export default function DeliveriesPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track your delivery requests.
        </p>
      </div>
      <DeliveriesTable />
    </div>
  )
}
