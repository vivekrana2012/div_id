package com.divid.backend.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class SQLiteConfig {

    @Bean
    public ApplicationRunner sqlitePragmaRunner(DataSource dataSource) {
        return args -> {
            // Enable WAL once at startup for better read/write concurrency in SQLite.
            try (var connection = dataSource.getConnection();
                 var statement = connection.createStatement()) {
                statement.execute("PRAGMA journal_mode=WAL");
            }
        };
    }
}
