#Generated at through the script C:\Users\mahmo\WebstormProjects\paperscissorsrock\bin\create-migration-file.js at 2024-03-03T16:21:14.781Z.
#
create table if not exists users
(
    id         int unsigned primary key auto_increment      not null,
    created_at datetime           default current_timestamp not null,
    public_id  varchar(36) unique default (uuid())          not null,
    name       varchar(64) unique                           not null,
    pass       varchar(128)                                 not null,
    salt       varchar(128)                                 not null
);

create table if not exists games
(
    id         int unsigned primary key auto_increment not null,
    created_at datetime                                not null,
    public_id  varchar(36) unique                      not null,
    player1    varchar(36)                             not null,
    player2    varchar(36)                             not null,
    rounds     json                                    not null,
    winner     tinyint unsigned,
    aborted    boolean,
    ended_at   datetime,
    ended      boolean,
    details    json
);

create table if not exists connections
(
    id         int unsigned primary key auto_increment not null,
    created_at datetime default current_timestamp      not null,
    user_id    int unsigned                            not null
);
