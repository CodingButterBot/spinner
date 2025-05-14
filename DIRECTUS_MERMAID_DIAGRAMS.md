# SpinPick Directus Schema - Mermaid Diagrams

This document provides detailed visualizations of the SpinPick database schema using Mermaid diagrams.

## Complete Schema Overview

This diagram shows all collections and their relationships in the SpinPick database schema:

```mermaid
erDiagram
    directus_users ||--o{ licenses : "has"
    directus_users ||--o{ spinner_settings : "creates"
    directus_users ||--o{ csv_mappings : "creates"
    directus_files ||--o{ spinner_appearance : "used_in"
    directus_files ||--o{ csv_imports : "original_file"
    
    spinner_settings ||--|| spinner_appearance : "has"
    spinner_settings ||--|| spinner_behavior : "has"
    spinner_settings ||--o{ spin_results : "used_for"
    spinner_settings ||--o{ csv_imports : "context_for"
    
    csv_mappings ||--o{ csv_imports : "applied_to"
    
    csv_imports ||--o{ spin_results : "contestants_from"
```

## Core Collection Relationship Diagram

This diagram shows the primary collections with their key fields:

```mermaid
classDiagram
    class directus_users {
        +string id PK
        +string email UK
        +string password
        +string first_name
        +string last_name
        +string theme_preference
    }
    
    class licenses {
        +uuid id PK
        +uuid user FK UK
        +string status
        +datetime expiration_date
    }
    
    class spinner_settings {
        +uuid id PK
        +uuid user FK
        +string name
        +string type
        +uuid appearance FK
        +uuid behavior FK
        +datetime date_created
        +datetime date_updated
    }
    
    class spinner_appearance {
        +uuid id PK
        +string background_color
        +string text_color
        +string accent_color
        +uuid background_image FK
        +uuid logo_image FK
        +json segment_colors
        +string font_family
    }
    
    class spinner_behavior {
        +uuid id PK
        +integer spin_duration
        +string spin_profile
        +integer revolutions
        +boolean confetti_enabled
        +boolean sound_enabled
        +string sound_choice
        +boolean allow_predefined_winner
        +string predetermined_winner
        +boolean remove_winner_from_pool
    }
    
    class csv_mappings {
        +uuid id PK
        +uuid user FK
        +string name
        +json mapping
        +datetime date_created
        +datetime date_updated
    }
    
    class csv_imports {
        +uuid id PK
        +uuid mapping FK
        +uuid spinner FK
        +string file_name
        +uuid file FK
        +integer record_count
        +datetime imported_at
        +string notes
    }
    
    class spin_results {
        +uuid id PK
        +uuid spinner FK
        +uuid import FK
        +string winner_name
        +json winner_details
        +datetime drawn_at
        +string notes
    }
    
    class directus_files {
        +uuid id PK
        +string storage
        +string filename_disk
        +string filename_download
        +string title
        +string type
        +uuid uploaded_by FK
        +datetime uploaded_on
    }
    
    directus_users "1" --> "0..1" licenses : has
    directus_users "1" --> "0..*" spinner_settings : creates
    directus_users "1" --> "0..*" csv_mappings : creates
    directus_users "1" --> "0..*" directus_files : uploads
    
    spinner_settings "1" --> "1" spinner_appearance : has
    spinner_settings "1" --> "1" spinner_behavior : has
    spinner_settings "1" --> "0..*" spin_results : produces
    spinner_settings "1" --> "0..*" csv_imports : context_for
    
    csv_mappings "1" --> "0..*" csv_imports : applied_to
    
    directus_files "1" --> "0..*" spinner_appearance : used_as_background
    directus_files "1" --> "0..*" spinner_appearance : used_as_logo
    directus_files "1" --> "0..*" csv_imports : source_file
    
    csv_imports "1" --> "0..*" spin_results : contestants_from
```

## User-Centered Relationships

This diagram focuses on the user perspective, showing all collections directly linked to a user:

```mermaid
erDiagram
    directus_users {
        uuid id PK
        string email UK
        string first_name
        string last_name
        string theme_preference
    }
    licenses {
        uuid id PK
        uuid user FK UK
        string status
        datetime expiration_date
    }
    spinner_settings {
        uuid id PK
        uuid user FK
        string name
        string type
    }
    csv_mappings {
        uuid id PK
        uuid user FK
        string name
        json mapping
    }
    directus_files {
        uuid id PK
        string title
        uuid uploaded_by FK
    }
    
    directus_users ||--o| licenses : "has"
    directus_users ||--o{ spinner_settings : "creates"
    directus_users ||--o{ csv_mappings : "creates"
    directus_users ||--o{ directus_files : "uploads"
```

## Spinner Configuration Hierarchy

This diagram shows the spinner configuration structure with appearance and behavior settings:

```mermaid
erDiagram
    spinner_settings {
        uuid id PK
        uuid user FK
        string name
        string type
    }
    spinner_appearance {
        uuid id PK
        string background_color
        string text_color
        string accent_color
        uuid background_image FK
        uuid logo_image FK
        json segment_colors
    }
    spinner_behavior {
        uuid id PK
        integer spin_duration
        string spin_profile
        boolean confetti_enabled
        boolean sound_enabled
    }
    directus_files {
        uuid id PK
        string title
        string type
    }
    
    spinner_settings ||--|| spinner_appearance : "has"
    spinner_settings ||--|| spinner_behavior : "has"
    directus_files ||--o{ spinner_appearance : "used_as_background"
    directus_files ||--o{ spinner_appearance : "used_as_logo"
```

## CSV Import and Mapping Flow

This diagram illustrates how CSV mappings, imports, and results are connected:

```mermaid
flowchart TD
    user[User] --> mapping[CSV Mapping]
    user --> spinner[Spinner Settings]
    mapping --> import[CSV Import]
    spinner --> import
    import --> results[Spin Results]
    spinner --> results
    
    subgraph "CSV Data Flow"
        mapping
        import
    end
    
    subgraph "Spinner Configuration"
        spinner
        appearance[Spinner Appearance]
        behavior[Spinner Behavior]
        spinner --- appearance
        spinner --- behavior
    end
    
    subgraph "Results Tracking"
        results
    end
    
    classDef userClass fill:#f9f,stroke:#333,stroke-width:2px
    classDef mappingClass fill:#bbf,stroke:#333,stroke-width:1px
    classDef spinnerClass fill:#bfb,stroke:#333,stroke-width:1px
    classDef importClass fill:#fbb,stroke:#333,stroke-width:1px
    classDef resultsClass fill:#bff,stroke:#333,stroke-width:1px
    
    class user userClass
    class mapping,import mappingClass
    class spinner,appearance,behavior spinnerClass
    class results resultsClass
```

## Spin Results Relationships

This diagram focuses on the spin results collection and its relationships:

```mermaid
erDiagram
    spinner_settings {
        uuid id PK
        string name
        string type
    }
    csv_imports {
        uuid id PK
        string file_name
        integer record_count
    }
    spin_results {
        uuid id PK
        uuid spinner FK
        uuid import FK
        string winner_name
        json winner_details
        datetime drawn_at
    }
    
    spinner_settings ||--o{ spin_results : "used_for"
    csv_imports ||--o{ spin_results : "contestants_from"
```

## License Management

This diagram shows the license management structure:

```mermaid
erDiagram
    directus_users {
        uuid id PK
        string email UK
        string first_name
        string last_name
    }
    licenses {
        uuid id PK
        uuid user FK UK
        string status
        datetime expiration_date
    }
    
    directus_users ||--o| licenses : "has"
```

## Data Flow for Spinner Operations

This sequence diagram illustrates the data flow during a typical spinner operation:

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DirectusAPI
    
    User->>App: Configure spinner
    App->>DirectusAPI: Create/Update spinner_settings
    DirectusAPI-->>App: Return spinner config ID
    
    App->>DirectusAPI: Create/Update spinner_appearance
    App->>DirectusAPI: Create/Update spinner_behavior
    
    User->>App: Upload CSV file
    App->>App: Parse CSV
    App->>DirectusAPI: Get or create csv_mapping
    DirectusAPI-->>App: Return mapping ID
    
    App->>DirectusAPI: Log csv_import (spinner + mapping)
    DirectusAPI-->>App: Return import ID
    
    User->>App: Spin the wheel
    App->>App: Run randomization
    App->>DirectusAPI: Record spin_result (spinner + import)
    DirectusAPI-->>App: Confirm result saved
    
    App->>User: Display winner
```

## File Storage and Usage

This diagram shows how files are stored and used in the system:

```mermaid
erDiagram
    directus_files {
        uuid id PK
        string storage
        string filename_disk
        string type
        uuid uploaded_by FK
    }
    spinner_appearance {
        uuid id PK
        uuid background_image FK
        uuid logo_image FK
    }
    csv_imports {
        uuid id PK
        uuid file FK
    }
    
    directus_files ||--o{ spinner_appearance : "used_as_background"
    directus_files ||--o{ spinner_appearance : "used_as_logo"
    directus_files ||--o{ csv_imports : "original_file"
```

## Security and Access Control

This diagram illustrates the security structure with user permissions:

```mermaid
flowchart TD
    user[User Account] --> own_spinners[Own Spinner Settings]
    user --> own_mappings[Own CSV Mappings]
    user --> own_imports[Own Imports]
    user --> own_results[Own Results]
    
    own_spinners --> appearance[Spinner Appearance]
    own_spinners --> behavior[Spinner Behavior]
    
    admin[Admin] --> all_users[All User Accounts]
    admin --> all_spinners[All Spinner Settings]
    admin --> all_mappings[All CSV Mappings]
    
    all_users --> user
    all_spinners --> own_spinners
    all_mappings --> own_mappings
    
    classDef userClass fill:#f9f,stroke:#333,stroke-width:2px
    classDef adminClass fill:#ff9,stroke:#333,stroke-width:2px
    classDef dataClass fill:#bfb,stroke:#333,stroke-width:1px
    
    class user userClass
    class admin adminClass
    class own_spinners,own_mappings,own_imports,own_results,appearance,behavior dataClass
    class all_users,all_spinners,all_mappings dataClass
```

## Implementation Guidelines

This diagram provides an overview of how to implement the schema in Directus:

```mermaid
flowchart TD
    start[Start Implementation] --> users[Configure User Collection]
    users --> spinners[Create Spinner Settings Collection]
    spinners --> appearance[Create Spinner Appearance Collection]
    spinners --> behavior[Create Spinner Behavior Collection]
    appearance & behavior --> mappings[Create CSV Mappings Collection]
    mappings --> imports[Create CSV Imports Collection]
    imports --> results[Create Spin Results Collection]
    results --> license[Create Licenses Collection]
    
    license --> relations[Set Up All Relationships]
    relations --> permissions[Configure Access Permissions]
    permissions --> interfaces[Set Up Directus Interfaces]
    interfaces --> validations[Add Field Validations]
    validations --> defaults[Set Default Values]
    defaults --> done[Schema Ready]
    
    classDef startEndClass fill:#f9f,stroke:#333,stroke-width:2px
    classDef collectionClass fill:#bbf,stroke:#333,stroke-width:1px
    classDef configClass fill:#bfb,stroke:#333,stroke-width:1px
    
    class start,done startEndClass
    class users,spinners,appearance,behavior,mappings,imports,results,license collectionClass
    class relations,permissions,interfaces,validations,defaults configClass
```

## Spinner Types and Customization Options

This diagram shows the different spinner types and their customization options:

```mermaid
mindmap
    root((Spinner Types))
        Wheel
            ::icon(fa fa-circle-notch)
            Background
                Color
                Image
            Segments
                Colors
                Text Color
            Animation
                Duration
                Profile
        Slot Machine
            ::icon(fa fa-dice)
            Reels
                Count
                Speed
            Symbols
                Size
                Colors
            Sound Effects
                Enabled/Disabled
                Type
        Reel
            ::icon(fa fa-list)
            Text
                Font
                Size
                Color
            Animation
                Speed
                Direction
```

## CSV Mapping Structure

This diagram illustrates the structure of CSV mappings:

```mermaid
graph TD
    subgraph "CSV File"
        csv_header["Header Row (Optional)"]
        csv_data["Data Rows"]
    end
    
    subgraph "Mapping Definition"
        name_column["Name Column"]
        ticket_column["Ticket Column"]
        email_column["Email Column (Optional)"]
        custom_columns["Additional Columns"]
    end
    
    subgraph "Import Process"
        parse["Parse CSV"]
        apply_mapping["Apply Mapping"]
        transform["Transform Data"]
        load["Load into App"]
    end
    
    csv_header --> parse
    csv_data --> parse
    parse --> apply_mapping
    name_column & ticket_column & email_column & custom_columns --> apply_mapping
    apply_mapping --> transform
    transform --> load
```

## Workflow: From Configuration to Results

This diagram shows the complete workflow from spinner configuration to results:

```mermaid
flowchart LR
    configure[Configure Spinner] --> customize[Customize Appearance]
    customize --> set_behavior[Set Behavior]
    set_behavior --> map_csv[Create CSV Mapping]
    map_csv --> import[Import Contestants]
    import --> spin[Spin for Winner]
    spin --> record[Record Result]
    record --> history[View History]
    
    subgraph "Spinner Setup"
        configure
        customize
        set_behavior
    end
    
    subgraph "Data Import"
        map_csv
        import
    end
    
    subgraph "Usage"
        spin
        record
        history
    end