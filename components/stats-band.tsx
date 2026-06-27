const stats = [
  { value: "2,400+", label: "Roofs matched" },
  { value: "850+", label: "Approved contractors" },
  { value: "4.9/5", label: "Average homeowner rating" },
  { value: "<24h", label: "Average quote time" },
]

export function StatsBand() {
  return (
    <section className="border-b border-border bg-accent">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-heading text-4xl font-bold text-accent-foreground sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-accent-foreground/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
