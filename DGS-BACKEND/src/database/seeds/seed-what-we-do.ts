import AppDataSource from '../data-source';
import { WhatWeDo } from '../../whatwedo/entities/what-we-do.entity';

const WHAT_WE_DO: Array<Partial<WhatWeDo>> = [
  {
    category: 'Central LPG Reticulation',
    problem: 'Frequent cylinder replacement',
    problem_desc:
      'Individual LPG cylinders require frequent replacement and are difficult to monitor.',
    solution: 'Centralized LPG reticulation',
    solution_desc:
      'A centralized LPG reticulation system provides continuous and safer gas distribution.',
    sort_order: 1,
  },
  {
    category: 'Central LPG Reticulation',
    problem: 'Manual gas supply interruptions',
    problem_desc:
      'Manual gas supply can interrupt restaurant and commercial kitchen operations.',
    solution: 'Automated centralized pipeline',
    solution_desc:
      'An automated centralized gas pipeline helps ensure an uninterrupted supply.',
    sort_order: 2,
  },
  {
    category: 'Central LPG Reticulation',
    problem: 'Cylinders occupy valuable space',
    problem_desc:
      'Multiple cylinders take up usable space and can create safety concerns.',
    solution: 'Dedicated gas bank',
    solution_desc:
      'A secure manifold system uses a dedicated gas bank with safety monitoring.',
    sort_order: 3,
  },
  {
    category: 'Central LPG Reticulation',
    problem: 'Difficult leak detection and maintenance',
    problem_desc:
      'Gas leaks can be difficult to detect and pipeline maintenance can be challenging.',
    solution: 'Designed pipeline safety',
    solution_desc:
      'A professionally designed pipeline includes safety valves and regular maintenance support.',
    sort_order: 4,
  },
  {
    category: 'Industrial Heavy Piping',
    problem: 'Piping not suited to operating pressure',
    problem_desc:
      'Incorrect pipe material or rating can create reliability and safety risks in industrial service.',
    solution: 'Engineered industrial pipe network',
    solution_desc:
      'Specify and install industrial piping to suit project requirements and applicable codes.',
    sort_order: 1,
  },
  {
    category: 'Industrial Heavy Piping',
    problem: 'Weld quality is difficult to verify',
    problem_desc:
      'Insufficient inspection can leave defects in critical industrial pipe joints undetected.',
    solution: 'Documented weld inspection',
    solution_desc:
      'Use qualified welding procedures and appropriate inspection and pressure testing.',
    sort_order: 2,
  },
  {
    category: 'Industrial Heavy Piping',
    problem: 'Unplanned production interruptions',
    problem_desc:
      'Unreliable process-gas piping can interrupt plant operations and production schedules.',
    solution: 'Reliable process-gas distribution',
    solution_desc:
      'Plan a fit-for-purpose network with isolation points and maintainable components.',
    sort_order: 3,
  },
  {
    category: 'Industrial Heavy Piping',
    problem: 'Complex project compliance',
    problem_desc:
      'Industrial pipeline projects must coordinate design, installation and applicable requirements.',
    solution: 'Coordinated engineering and testing',
    solution_desc:
      'Coordinate design reviews, installation records and commissioning tests for the project.',
    sort_order: 4,
  },
  {
    category: 'AutoGas Refueling Stations',
    problem: 'Station design has multiple safety needs',
    problem_desc:
      'Autogas stations require coordinated storage, dispensing and safety systems.',
    solution: 'Integrated station engineering',
    solution_desc:
      'Plan station equipment and safety provisions together for the site and its operating needs.',
    sort_order: 1,
  },
  {
    category: 'AutoGas Refueling Stations',
    problem: 'Equipment selection is challenging',
    problem_desc:
      'Pressure vessels, dispensers and related equipment must suit the station design.',
    solution: 'Matched equipment specification',
    solution_desc:
      'Select compatible equipment based on engineering requirements and applicable approvals.',
    sort_order: 2,
  },
  {
    category: 'AutoGas Refueling Stations',
    problem: 'Hazardous-area risks',
    problem_desc:
      'Electrical equipment and site layout must account for hazardous areas around fuel systems.',
    solution: 'Safety-focused layout',
    solution_desc:
      'Coordinate hazardous-area equipment and site safeguards during station design.',
    sort_order: 3,
  },
  {
    category: 'AutoGas Refueling Stations',
    problem: 'Approval and commissioning coordination',
    problem_desc:
      'Station delivery requires coordination of installation, inspections and required approvals.',
    solution: 'Coordinated project delivery',
    solution_desc:
      'Support the project through installation checks, testing and approval coordination.',
    sort_order: 4,
  },
  {
    category: 'Utility RMS & Compliance',
    problem: 'Inconsistent gas pressure',
    problem_desc:
      'Gas supply pressure must be regulated to meet the connected facility’s operating needs.',
    solution: 'Regulator and metering station',
    solution_desc:
      'Design an RMS arrangement with suitable regulation, filtration and metering components.',
    sort_order: 1,
  },
  {
    category: 'Utility RMS & Compliance',
    problem: 'Measurement reliability concerns',
    problem_desc:
      'Poorly maintained metering equipment can reduce confidence in gas-use measurements.',
    solution: 'Maintained metering equipment',
    solution_desc:
      'Provide appropriate metering equipment and plan inspection and maintenance.',
    sort_order: 2,
  },
  {
    category: 'Utility RMS & Compliance',
    problem: 'Protection during abnormal pressure',
    problem_desc:
      'Pressure changes can affect downstream equipment if protective devices are inadequate.',
    solution: 'Pressure safety devices',
    solution_desc:
      'Include suitable slam-shut and pressure relief protection in the station design.',
    sort_order: 3,
  },
  {
    category: 'Utility RMS & Compliance',
    problem: 'Utility requirements are difficult to coordinate',
    problem_desc:
      'Gas connection and commissioning may require coordination with utility requirements.',
    solution: 'Utility approval coordination',
    solution_desc:
      'Coordinate technical documentation, inspections and commissioning requirements with the utility.',
    sort_order: 4,
  },
];

async function seedWhatWeDo() {
  console.log('--- Initializing What We Do Seeder ---');
  await AppDataSource.initialize();

  try {
    const repo = AppDataSource.getRepository(WhatWeDo);
    let created = 0;
    let skipped = 0;

    for (const seed of WHAT_WE_DO) {
      const existing = await repo.findOne({
        where: {
          category: seed.category,
          sort_order: seed.sort_order,
          is_deleted: false,
        },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await repo.save(
        repo.create({
          ...seed,
          is_available: true,
          is_deleted: false,
        }),
      );
      created += 1;
    }

    console.log(
      `What We Do seeded — ${created} created, ${skipped} existing rows skipped.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

seedWhatWeDo().catch((err) => {
  console.error('What We Do seeder failed:', err);
  process.exit(1);
});
