# Full Viva Prep Short Notes

Use this like a last-minute revision sheet. Answers are intentionally short, viva-style, and easy to expand aloud.

## How To Answer In Viva

| Situation | Short Answer Pattern |
|---|---|
| Definition question | Define + one example |
| Difference question | Give 3-4 table points |
| Project question | Feature + file/module + why used |
| Why question | State benefit: security, maintainability, performance, UX |
| If you do not know | Say the concept you know, then connect it honestly |

## Java OOP Quick Table

| Topic | Can Have / Can Do | Cannot Have / Cannot Do | Keywords | Example Viva Answer |
|---|---|---|---|---|
| Class | Fields, methods, constructors, objects | Cannot use multiple class inheritance | `class`, `new` | A class is a blueprint for objects. |
| Object | State and behavior | Cannot exist without class type | `new` | Object is an instance of a class. |
| Abstract class | Abstract and concrete methods, constructors, fields, child classes | Cannot create direct object | `abstract`, `extends` | Abstract class is incomplete parent class used for common behavior. |
| Interface | Abstract methods, constants, default/static/private methods | Cannot have normal instance fields or constructors | `interface`, `implements` | Interface defines a contract that classes implement. |
| Encapsulation | Private data + public getters/setters | Direct unsafe access should be avoided | `private`, `public` | It protects data by binding fields and methods together. |
| Inheritance | Child can reuse parent members | Java class cannot extend multiple classes | `extends` | It supports code reuse and IS-A relationship. |
| Polymorphism | Same method name, different behavior | Compile-time overloading cannot depend only on return type | `overload`, `override` | One interface, many implementations. |
| Abstraction | Hide internal details | Should not expose unnecessary implementation | `abstract`, `interface` | Shows what an object does, hides how. |

## Abstract Class Vs Interface

| Point | Abstract Class | Interface |
|---|---|---|
| Used for | Common base + partial implementation | Contract/capability |
| Object creation | Cannot create object directly | Cannot create object directly |
| Inheritance keyword | Child class uses `extends` | Class uses `implements` |
| Multiple allowed? | Class can extend only one abstract/class parent | Class can implement many interfaces |
| Constructors | Yes | No constructors |
| Variables | Instance/static/final variables possible | Variables are `public static final` by default |
| Methods | Abstract + concrete methods | Abstract, default, static, private methods |
| When to use | Shared state or common code | Common behavior across unrelated classes |

### Abstract Class Mini Example

```java
abstract class Payment {
    abstract void pay(double amount);

    void printReceipt() {
        System.out.println("Receipt generated");
    }
}

class UpiPayment extends Payment {
    @Override
    void pay(double amount) {
        System.out.println("Paid by UPI: " + amount);
    }
}
```

Important viva lines:

| Question | Answer |
|---|---|
| Does abstract class have child? | Yes, child class extends it. |
| Can abstract class make object? | No direct object, but reference can point to child object. |
| How to extend? | `class Child extends AbstractParent`. |
| How to implement abstract method? | Child overrides all abstract methods. |
| Can abstract class have constructor? | Yes, called when child object is created. |
| Can abstract class have main method? | Yes. |
| Can abstract class be final? | No, because final prevents inheritance. |

## Java Keywords

| Keyword | Meaning | Viva Note |
|---|---|---|
| `this` | Current object reference | Used to access current object's fields/methods. |
| `super` | Parent class reference | Used to call parent constructor/method. |
| `static` | Belongs to class, not object | Shared by all objects. |
| `final` | Cannot be changed/overridden/inherited | Final variable constant, final method not overridden, final class not inherited. |
| `abstract` | Incomplete method/class | Must be completed by child class. |
| `private` | Same class only | Strongest access restriction. |
| `protected` | Same package + subclass | Useful in inheritance. |
| `public` | Everywhere | Least restricted. |
| `default` access | Same package only | No keyword used. |

## Java Inheritance

| Type | Java Support | Example |
|---|---|---|
| Single | Yes | `B extends A` |
| Multilevel | Yes | `C extends B extends A` |
| Hierarchical | Yes | `B extends A`, `C extends A` |
| Multiple by classes | No | Avoids diamond problem |
| Multiple by interfaces | Yes | `class A implements X, Y` |

Viva line: Java does not support multiple inheritance with classes, but supports it through interfaces.

## Method Overloading Vs Overriding

| Point | Overloading | Overriding |
|---|---|---|
| Meaning | Same method name, different parameters | Child redefines parent method |
| Happens in | Same class mostly | Parent-child classes |
| Binding | Compile-time polymorphism | Runtime polymorphism |
| Return type only change | Not allowed | Return type can be covariant |
| Access modifier | Any | Cannot reduce visibility |
| Static method | Can be overloaded | Static methods are hidden, not truly overridden |

## Constructor Notes

| Question | Answer |
|---|---|
| What is constructor? | Special block used to initialize object. |
| Same name as class? | Yes. |
| Return type? | No return type. |
| Can overload? | Yes. |
| Can inherit? | No. |
| Can be private? | Yes, used in Singleton or utility restriction. |
| Default constructor? | Compiler provides only if no constructor is written. |
| First line? | `this()` or `super()` if used; otherwise `super()` is implicit. |

## Java Exception Handling

| Topic | Meaning | Example |
|---|---|---|
| Exception | Runtime problem interrupting normal flow | Divide by zero, file missing |
| Checked exception | Checked at compile time | `IOException`, `SQLException` |
| Unchecked exception | Runtime exception | `NullPointerException`, `ArithmeticException` |
| `try` | Risky code | Open file |
| `catch` | Handles exception | Print message/recover |
| `finally` | Always executes mostly | Close resource |
| `throw` | Manually throw one exception | `throw new Exception()` |
| `throws` | Declares possible exception | Method signature |

Viva line: Use checked exceptions for recoverable external problems, unchecked for programming errors.

## Java Collections

| Interface/Class | Allows Duplicates | Ordered? | Key Point |
|---|---:|---:|---|
| `List` | Yes | Yes | Index-based collection |
| `ArrayList` | Yes | Yes | Fast search, slow middle insert/delete |
| `LinkedList` | Yes | Yes | Fast insert/delete, slower random access |
| `Set` | No | Depends | Unique elements |
| `HashSet` | No | No guaranteed order | Uses hashing |
| `LinkedHashSet` | No | Insertion order | Predictable order |
| `TreeSet` | No | Sorted | Uses natural/comparator sorting |
| `Map` | Keys unique | Depends | Key-value pairs |
| `HashMap` | Keys unique | No guaranteed order | Allows one null key |
| `TreeMap` | Keys unique | Sorted keys | No null key generally |

## ArrayList Vs LinkedList

| Point | ArrayList | LinkedList |
|---|---|---|
| Internal structure | Dynamic array | Doubly linked list |
| Random access | Fast | Slow |
| Insert/delete middle | Slower | Faster if node known |
| Memory | Less overhead | More overhead due to links |
| Use when | More reading/searching | More insert/delete operations |

## HashMap Viva Notes

| Question | Answer |
|---|---|
| What is HashMap? | Key-value data structure. |
| Duplicate keys? | No, new value replaces old value for same key. |
| Duplicate values? | Yes. |
| Null allowed? | One null key, multiple null values. |
| Ordered? | No guaranteed order. |
| How works internally? | Uses hashCode to find bucket, equals to compare keys. |

## String Notes

| Topic | Meaning |
|---|---|
| `String` | Immutable text object. |
| String pool | Special memory area for string literals. |
| `StringBuilder` | Mutable, fast, not synchronized. |
| `StringBuffer` | Mutable, synchronized, thread-safe but slower. |
| `==` | Compares references for objects. |
| `.equals()` | Compares content if implemented. |

## JVM, JRE, JDK

| Term | Meaning |
|---|---|
| JVM | Runs bytecode. Platform-dependent implementation. |
| JRE | JVM + libraries to run Java app. |
| JDK | JRE + compiler/tools for development. |
| Bytecode | `.class` intermediate code generated by compiler. |
| Platform independent | Java source compiles to bytecode that runs on JVM. |

## Java Memory

| Area | Stores |
|---|---|
| Stack | Method calls, local variables, references |
| Heap | Objects and instance variables |
| Method area/metaspace | Class metadata, static data |
| String pool | String literals |

Viva line: Local variables live in stack; objects live in heap.

## Multithreading

| Topic | Meaning |
|---|---|
| Process | Independent running program. |
| Thread | Lightweight unit inside process. |
| `Thread` class | Extend to create thread. |
| `Runnable` | Implement to define task. Preferred because class can still extend another class. |
| `start()` | Creates new thread and calls `run()`. |
| `run()` | Task body; direct call does not create new thread. |
| Synchronization | Controls shared resource access. |
| Deadlock | Threads wait forever for each other's locks. |

## SQL / Database

| Topic | Short Note |
|---|---|
| DBMS | Software to store/manage data. |
| RDBMS | Stores data in related tables. |
| Table | Rows and columns. |
| Primary key | Unique identifier, not null. |
| Foreign key | References primary key of another table. |
| Candidate key | Possible unique key. |
| Composite key | Key made of multiple columns. |
| Normalization | Reduces redundancy. |
| Denormalization | Adds redundancy for faster reads. |
| Transaction | Group of operations executed as one unit. |
| ACID | Atomicity, Consistency, Isolation, Durability. |

## SQL Commands

| Type | Commands | Meaning |
|---|---|---|
| DDL | `CREATE`, `ALTER`, `DROP`, `TRUNCATE` | Structure changes |
| DML | `INSERT`, `UPDATE`, `DELETE` | Data changes |
| DQL | `SELECT` | Data query |
| DCL | `GRANT`, `REVOKE` | Permissions |
| TCL | `COMMIT`, `ROLLBACK`, `SAVEPOINT` | Transaction control |

## SQL Joins

| Join | Meaning |
|---|---|
| Inner join | Matching records from both tables. |
| Left join | All left table records + matching right records. |
| Right join | All right table records + matching left records. |
| Full join | All records from both sides where supported. |
| Cross join | Cartesian product. |
| Self join | Table joined with itself. |

## Backend Basics

| Topic | Short Note |
|---|---|
| Backend | Server-side logic, database, APIs, authentication. |
| API | Contract for communication between systems. |
| REST | Resource-based API style using HTTP methods. |
| Endpoint | URL where API is accessed. |
| DTO | Data Transfer Object; carries data between layers. |
| Entity | Object mapped to database table. |
| Repository/DAO | Database access layer. |
| Service | Business logic layer. |
| Controller | Handles HTTP request/response. |
| Middleware/filter | Code that runs before/after request handling. |

## REST API Methods

| Method | Purpose | Example |
|---|---|---|
| GET | Read data | Get events |
| POST | Create data | Create booking |
| PUT | Full update | Replace event details |
| PATCH | Partial update | Update ticket status |
| DELETE | Delete data | Cancel resource |

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Success with no body |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Authenticated but not allowed |
| 404 | Not found |
| 409 | Conflict, duplicate/state issue |
| 500 | Server error |

## Authentication Vs Authorization

| Topic | Meaning | Example |
|---|---|---|
| Authentication | Verifies identity | Login with email/password |
| Authorization | Verifies permission | Admin can manage users |
| Session | Server/client remembers login state | Cookie session |
| JWT | Token carrying claims | Bearer token in API call |
| 2FA | Extra verification factor | OTP after password |

## Spring Boot Viva Basics

| Annotation | Meaning |
|---|---|
| `@SpringBootApplication` | Main Spring Boot app annotation. |
| `@RestController` | Controller returning data, not view. |
| `@RequestMapping` | Base route mapping. |
| `@GetMapping` | Handles GET request. |
| `@PostMapping` | Handles POST request. |
| `@Service` | Marks business logic class. |
| `@Repository` | Marks database access class. |
| `@Entity` | Maps class to database table. |
| `@Id` | Primary key field. |
| `@Autowired` | Dependency injection. Constructor injection is preferred. |
| `@Valid` | Triggers validation. |

## Layered Backend Flow

```text
Client -> Controller -> Service -> Repository -> Database
Client <- Controller <- Service <- Repository <- Database
```

Viva line: Controller should not contain heavy business logic; service layer should handle rules.

## Frontend Basics

| Topic | Short Note |
|---|---|
| HTML | Structure of web page. |
| CSS | Styling and layout. |
| JavaScript | Behavior and interactivity. |
| TypeScript | JavaScript with static types. |
| React | UI library based on components. |
| Next.js | React framework with routing, SSR/SSG, API routes. |
| Component | Reusable UI block. |
| Props | Data passed from parent to child. |
| State | Data managed inside component. |
| Hook | Function for React features like state/effect. |

## HTML Quick Notes

| Topic | Meaning |
|---|---|
| Semantic HTML | Meaningful tags like `header`, `main`, `section`, `button`. |
| Form | Collects user input. |
| `input` | Takes data from user. |
| `label` | Improves accessibility for input. |
| `alt` | Text alternative for image. |
| `meta viewport` | Makes page responsive on mobile. |

## CSS Quick Notes

| Topic | Meaning |
|---|---|
| Box model | Content, padding, border, margin. |
| Flexbox | One-dimensional layout. |
| Grid | Two-dimensional layout. |
| Responsive design | Layout adapts to screen size. |
| Media query | CSS condition for screen sizes. |
| Specificity | Rule priority system. |
| CSS variable | Reusable custom property like `--color-primary`. |

## JavaScript / TypeScript

| Topic | Short Note |
|---|---|
| `let` | Block-scoped variable, can reassign. |
| `const` | Block-scoped constant binding. |
| `var` | Function-scoped old variable. |
| Promise | Represents future async result. |
| `async/await` | Cleaner promise handling. |
| Callback | Function passed as argument. |
| Interface in TS | Defines object shape. |
| Type in TS | Creates type alias/union/object shape. |
| Optional property | `name?: string`. |
| Union type | `string | number`. |

## React Viva Notes

| Topic | Short Note |
|---|---|
| Virtual DOM | Lightweight UI representation used for efficient updates. |
| JSX | HTML-like syntax in JavaScript/TypeScript. |
| Props | Read-only data passed to component. |
| State | Mutable component data causing re-render. |
| `useState` | Stores state in functional component. |
| `useEffect` | Runs side effects after render. |
| Controlled component | Form value controlled by React state. |
| Conditional rendering | Show UI based on condition. |
| List key | Helps React identify changed items. |

## Next.js App Router

| Concept | Meaning |
|---|---|
| `app/` directory | Route structure for App Router. |
| `page.tsx` | UI for a route. |
| `layout.tsx` | Shared wrapper for nested routes. |
| `loading.tsx` | Loading UI for route segment. |
| Dynamic route | Folder like `[eventId]`. |
| API route handler | File like `route.ts` responding to HTTP methods. |
| Server component | Runs on server by default. |
| Client component | Uses browser features, marked with `"use client"`. |
| SSR | Server-side rendering per request. |
| SSG | Static generation at build time. |

## Git Basics

| Command | Meaning |
|---|---|
| `git init` | Create local git repo. |
| `git status` | Show changed/staged files. |
| `git add .` | Stage files. |
| `git commit -m "msg"` | Save staged snapshot. |
| `git log` | Show commit history. |
| `git diff` | Show unstaged changes. |
| `git branch` | List/create branches. |
| `git switch branch` | Switch branch. |
| `git merge branch` | Merge branch into current branch. |
| `git pull` | Fetch + merge/rebase remote changes. |
| `git push` | Upload commits to remote. |
| `git clone url` | Copy remote repo locally. |

## Git Areas

| Area | Meaning |
|---|---|
| Working directory | Files you are editing. |
| Staging area | Files selected for next commit. |
| Local repository | Commits saved on your machine. |
| Remote repository | Repo hosted on GitHub/GitLab/etc. |

## Git Viva Questions

| Question | Answer |
|---|---|
| Git vs GitHub? | Git is version control tool; GitHub is hosting platform. |
| Why branch? | To develop features without disturbing main code. |
| Merge conflict? | Same lines changed differently in two branches. |
| Commit? | Snapshot of staged changes. |
| Pull request? | Request to review and merge changes. |
| `.gitignore`? | Lists files Git should not track. |
| `fetch` vs `pull`? | Fetch downloads remote updates; pull downloads and integrates. |
| `merge` vs `rebase`? | Merge preserves branch history; rebase rewrites commits on new base. |

## Full Stack Flow

```text
User clicks UI
-> React component handles event
-> Frontend calls API
-> Backend controller receives request
-> Service applies business rules
-> Repository reads/writes database
-> Backend returns JSON response
-> Frontend updates UI state
```

## Event Management Project Viva Notes

| Project Topic | Short Answer |
|---|---|
| Project name | Event Management and Ticketing System frontend demo. |
| Tech stack | Next.js, React, TypeScript, mocked APIs. |
| Main users | Customer, Organizer, Venue Staff, Admin, Corporate Client. |
| Purpose | Manage event discovery, booking, tickets, scanning, admin, and corporate bulk booking flows. |
| Backend status | Frontend-only demo with mock data and API-like service boundaries. |
| Future backend | Can integrate with Java Spring Boot controllers/services/entities. |
| Routing | Next.js App Router under `app/`. |
| Mock API | Route handler under `app/api/emts/[...path]/route.ts`. |
| Data contracts | Types/DTO-like structures in `types` and service layer. |

## EMTS Modules

| Module | Responsibility |
|---|---|
| Customer | Browse events, checkout, tickets, booking history, notifications. |
| Organizer | Manage events, ticket categories, reports, revenue, attendance, expenses. |
| Staff | Scan QR tickets, validate entry, handle duplicates. |
| Admin | Manage users, roles, settings, logs, reports, security. |
| Corporate | Bulk booking request, payment link, invoices, ticket delivery. |

## EMTS Entity Ideas For Java Backend

| Entity | Main Fields / Meaning |
|---|---|
| User | id, name, email, passwordHash, role, status |
| Event | id, title, venue, date, organizerId, capacity, status |
| TicketCategory | id, eventId, name, price, totalSeats, availableSeats |
| Booking | id, userId, eventId, amount, status, createdAt |
| Ticket | id, bookingId, qrCode, status, checkedInAt |
| Payment | id, bookingId, amount, provider, status |
| Refund | id, bookingId, amount, reason, status |
| EntryScanLog | id, ticketId, staffId, result, scannedAt |
| Notification | id, userId, title, message, readStatus |
| Expense | id, eventId, category, amount |

## Backend Design For EMTS

| Layer | Example |
|---|---|
| Controller | `BookingController` handles `/api/bookings`. |
| Service | `BookingService` checks seats, calculates amount, creates booking. |
| Repository | `BookingRepository` saves booking in database. |
| DTO | `CreateBookingRequest`, `BookingResponse`. |
| Entity | `Booking`, `Ticket`, `Payment`. |

## Important Business Rules

| Rule | Why Important |
|---|---|
| Do not oversell tickets | Capacity and seat count must be protected. |
| One QR ticket should not scan twice | Prevent duplicate entry. |
| Payment success should confirm booking | Booking status depends on payment state. |
| Refund depends on policy | Ensures fair cancellation rules. |
| Role-based access | Customer, admin, staff, organizer see different features. |
| Audit logs | Useful for admin/security tracking. |

## Security Notes

| Topic | Short Note |
|---|---|
| Password hashing | Store hash, never plain password. |
| HTTPS | Encrypts network traffic. |
| Input validation | Prevents bad data and attacks. |
| SQL injection prevention | Use prepared statements/ORM parameters. |
| XSS prevention | Escape/sanitize unsafe HTML. |
| CSRF | Protect state-changing requests, especially cookie-based auth. |
| RBAC | Role-Based Access Control. |
| Least privilege | Give only required permissions. |

## Testing Notes

| Test Type | Meaning |
|---|---|
| Unit test | Tests small function/class. |
| Integration test | Tests combined modules/API/database. |
| UI test | Tests user interface behavior. |
| E2E test | Tests full user flow. |
| Manual test | Human checks behavior. |
| Regression test | Ensures old features still work. |

## Deployment Notes

| Topic | Short Note |
|---|---|
| Build | Converts source into production-ready output. |
| Environment variables | Config like API URL, secrets. Do not commit secrets. |
| Vercel | Common deployment platform for Next.js. |
| CI/CD | Automated test/build/deploy pipeline. |
| Production | Live user-facing environment. |
| Staging | Testing environment similar to production. |

## Common Difference Tables

### Frontend Vs Backend

| Frontend | Backend |
|---|---|
| Runs in browser/client | Runs on server |
| UI and user interaction | Business logic and database |
| React, HTML, CSS, JS | Java, Spring Boot, Node, DB |
| Calls APIs | Provides APIs |

### SQL Vs NoSQL

| SQL | NoSQL |
|---|---|
| Table-based | Document/key-value/graph/etc. |
| Fixed schema | Flexible schema |
| Good for relations/transactions | Good for scale/flexible data |
| Example: MySQL, PostgreSQL | Example: MongoDB, Redis |

### GET Vs POST

| GET | POST |
|---|---|
| Reads data | Creates/submits data |
| Parameters often in URL | Data usually in body |
| Should be idempotent/safe | May change server state |
| Can be cached | Usually not cached |

### Client Component Vs Server Component In Next.js

| Client Component | Server Component |
|---|---|
| Uses `"use client"` | Default in App Router |
| Can use hooks and browser APIs | Cannot use browser-only APIs directly |
| Sent more JS to browser | Less client JS |
| Good for interactive UI | Good for data fetching/static UI |

## 2-Line Answers To Common Viva Questions

| Question | Short Answer |
|---|---|
| Why TypeScript? | It catches type errors early and improves maintainability. |
| Why React? | It builds reusable component-based UI efficiently. |
| Why Next.js? | It adds routing, rendering options, API routes, and deployment support to React. |
| Why Git? | It tracks code history and supports collaboration. |
| Why DTO? | It separates external request/response format from internal entity. |
| Why service layer? | It keeps business logic separate from controller and repository. |
| Why validation? | It protects app from invalid input and improves data quality. |
| Why role-based portals? | Different users need different permissions and workflows. |
| Why QR tickets? | They provide fast and unique ticket validation at venue entry. |
| Why mocked APIs? | They allow frontend development before real backend is ready. |

## Java Mini Code Patterns

### Interface

```java
interface Scannable {
    void scan();
}

class TicketScanner implements Scannable {
    public void scan() {
        System.out.println("Ticket scanned");
    }
}
```

### Inheritance

```java
class User {
    String name;
}

class Admin extends User {
    void manageUsers() {
        System.out.println("Managing users");
    }
}
```

### Encapsulation

```java
class Ticket {
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
```

### Exception

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Invalid division");
} finally {
    System.out.println("Done");
}
```

## Final Rapid Revision Checklist

| Area | Must Know |
|---|---|
| Java | OOP, abstract class, interface, exceptions, collections, strings, JVM. |
| Git | init, add, commit, branch, merge, pull, push, conflict. |
| Frontend | HTML, CSS, JS, TS, React, Next.js routing, components, state, props. |
| Backend | REST, HTTP, controller-service-repository, DTO, entity, auth, database. |
| Database | Keys, joins, normalization, transactions, SQL commands. |
| Project | Roles, modules, flows, mock API, future Java backend mapping. |
| Security | Auth vs authorization, password hashing, validation, RBAC, XSS/SQL injection. |

## Best Closing Line In Viva

This project is currently a Next.js frontend demo with mock data, but it is structured with clear modules, services, DTO-like types, and role-based flows so that a Java Spring Boot backend can be integrated later with controllers, services, repositories, and database entities.
