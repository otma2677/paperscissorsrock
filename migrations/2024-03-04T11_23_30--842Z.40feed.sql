#Generated at through the script C:\Users\mahmo\WebstormProjects\paperscissorsrock\bin\create-migration-file.js at 2024-03-04T11:23:30.844Z.

create table if not exists messages
(
    id         int unsigned primary key auto_increment not null,
    created_at datetime    default current_timestamp   not null,
    public_id  varchar(36) default (uuid())            not null,
    title      varchar(64)                             not null,
    email      varchar(256)                            not null,
    content    varchar(4096)                           not null
);
