import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    id: "errands",
    name: "Errands & Daily Tasks",
    description: "Bills, banks, documents, government work",
    icon: "check-square",
    displayOrder: 1,
    tasks: [
      { name: "Pickups & Deliveries", description: "Courier, parcel pickups and intra-city drop-offs" },
      { name: "Payments & Renewals", description: "Electricity, water bills, property tax & subscriptions" },
      { name: "Documents & Government", description: "Passport, Aadhaar, RTO, notarization & paperwork" },
      { name: "Shopping", description: "Specialty groceries, market runs, hardware & gifting" },
      { name: "Bank & Financial Runs", description: "Cheque deposits, DD creation & bank paperwork" },
    ],
  },
  {
    id: "home_services",
    name: "Home Services",
    description: "AC, plumbing, electrical, cleaning, repairs",
    icon: "home",
    displayOrder: 2,
    tasks: [
      { name: "Cleaning", description: "Deep cleaning, kitchen, sofa, carpet & window cleaning" },
      { name: "Repairs", description: "Carpentry, masonry, tile repair & general handyman" },
      { name: "Appliances & Utilities", description: "AC servicing, refrigerator, washing machine & RO service" },
      { name: "Property & Society", description: "Society office liaison, parking permits & maintenance queries" },
      { name: "Electrical & Plumbing", description: "Wiring, switchboard fixes, pipe leaks & faucet fittings" },
    ],
  },
  {
    id: "travel",
    name: "Travel & Tourism",
    description: "Flights, hotels, visas, transfers, itineraries",
    icon: "map-pin",
    displayOrder: 3,
    tasks: [
      { name: "Flights & Train Bookings", description: "Seat selection, meal booking & cancellation handling" },
      { name: "Hotels & Stays", description: "Boutique stays, resort bookings & late check-in coordination" },
      { name: "Visas & Documentation", description: "Visa appointment slots, document review & submission" },
      { name: "Transfers & Cabs", description: "Airport pickup, outstation cab booking & chauffeurs" },
      { name: "Custom Itineraries", description: "Personalized holiday plans, day trip bookings & experiences" },
    ],
  },
  {
    id: "health",
    name: "Health & Medical",
    description: "Doctor visits, pharmacy, labs, physio",
    icon: "heart",
    displayOrder: 4,
    tasks: [
      { name: "Doctor Visits & Consults", description: "Specialist appointments, OPD bookings & second opinions" },
      { name: "Pharmacy & Medicines", description: "Prescription refills, hard-to-find medicines & delivery" },
      { name: "Labs & Diagnostic Tests", description: "At-home blood collection, MRI/CT scans & report collection" },
      { name: "Physiotherapy & Nursing", description: "In-home physiotherapist & caregiver coordination" },
    ],
  },
  {
    id: "senior_care",
    name: "Senior Care",
    description: "Check-ins, medicines, vitals, companionship",
    icon: "users",
    displayOrder: 5,
    tasks: [
      { name: "Daily Check-ins", description: "Scheduled morning & evening well-being check-ins" },
      { name: "Medicine Management", description: "Pill organizer refill, dose reminders & doctor coordination" },
      { name: "Vitals Monitoring", description: "Blood pressure, sugar tracking & vitals logging" },
      { name: "Companionship & Walks", description: "Assisted park walks, social outings & doctor companion" },
    ],
  },
  {
    id: "events",
    name: "Events & Management",
    description: "Weddings, décor, catering, photography",
    icon: "calendar",
    displayOrder: 6,
    tasks: [
      { name: "Catering & Private Chefs", description: "Menu curation, live counters & party catering" },
      { name: "Décor & Floral Setup", description: "Birthday backdrops, festive lighting & floral arrangements" },
      { name: "Photography & Videography", description: "Family functions, birthdays & event shoots" },
      { name: "Venue & Vendor Coordination", description: "Hall booking, sound system, DJ & license permissions" },
    ],
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
      },
      create: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
      },
    });

    console.log(`Created/Updated category: ${category.name}`);

    for (let i = 0; i < cat.tasks.length; i++) {
      const t = cat.tasks[i];
      const existing = await prisma.task.findFirst({
        where: { categoryId: category.id, name: t.name },
      });

      if (!existing) {
        await prisma.task.create({
          data: {
            categoryId: category.id,
            name: t.name,
            description: t.description,
            displayOrder: i + 1,
          },
        });
      }
    }
  }

  const taskCount = await prisma.task.count();
  const categoryCount = await prisma.category.count();
  console.log(` Seeded ${categoryCount} categories and ${taskCount} tasks successfully!`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
