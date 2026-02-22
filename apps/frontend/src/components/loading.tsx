export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-xl skeleton" />
      <div className="h-4 w-96 max-w-full rounded-xl skeleton" />
      <div className="h-64 w-full rounded-2xl skeleton" />
    </div>
  )
}