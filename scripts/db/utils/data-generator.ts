export class DataGenerator {
  private firstNames = [
    'James',
    'Mary',
    'Robert',
    'Patricia',
    'John',
    'Jennifer',
    'Michael',
    'Linda',
    'David',
    'Elizabeth',
    'William',
    'Barbara',
    'Richard',
    'Susan',
    'Joseph',
    'Jessica',
    'Thomas',
    'Sarah',
    'Charles',
    'Karen',
    'Christopher',
    'Nancy',
    'Daniel',
    'Lisa',
    'Matthew',
    'Margaret',
    'Anthony',
    'Betty',
    'Donald',
    'Sandra',
    'Mark',
    'Ashley',
    'Paul',
    'Dorothy',
    'Steven',
    'Kimberly',
    'Andrew',
    'Emily',
    'Kenneth',
    'Donna',
    'George',
    'Michelle',
    'Joshua',
    'Carol',
    'Kevin',
    'Amanda',
    'Brian',
    'Melissa',
    'Edward',
    'Deborah',
  ]

  private lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
    'Adams',
    'Nelson',
    'Baker',
    'Hall',
    'Rivera',
    'Campbell',
    'Mitchell',
    'Carter',
    'Roberts',
  ]

  private tasksVerbs = [
    'Implement',
    'Design',
    'Refactor',
    'Fix',
    'Test',
    'Deploy',
    'Analyze',
    'Review',
    'Update',
    'Create',
    'Delete',
    'Optimize',
    'Document',
    'Configure',
    'Migrate',
  ]

  private tasksNouns = [
    'Login Page',
    'User Profile',
    'Dashboard',
    'API Endpoint',
    'Database Schema',
    'CI Pipeline',
    'Docker Container',
    'Unit Tests',
    'Integration Tests',
    'Documentation',
    'Style Guide',
    'Component Library',
    'Auth Flow',
    'Payment Gateway',
    'Email Service',
    'Notification System',
    'Search Feature',
    'Filter Logic',
  ]

  randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  randomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  randomBoolean(probability = 0.5): boolean {
    return Math.random() < probability
  }

  fullName() {
    return `${this.randomItem(this.firstNames)} ${this.randomItem(this.lastNames)}`
  }

  email(name: string) {
    const [first, last] = name.toLowerCase().split(' ')
    return `${first}.${last}@example.com`
  }

  generateTaskTitle() {
    return `${this.randomItem(this.tasksVerbs)} ${this.randomItem(this.tasksNouns)}`
  }

  generateDescription() {
    return `This is a generated description for the item. It contains random text to simulate real content.
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
  }
}
