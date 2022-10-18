--call source_pokeapi_app.app_schema.sync_connector_to_table('public.test_pokeapi', {'pokemon_name': 'zapdos'});



--CREATE or replace  SCHEMA source_pokeapi_app.app_schema;

-- Internal procedure that will not be exposed to the consumer
-- created from notebook...

-- Procedure that will be exposed to the consumer
CREATE or replace PROCEDURE source_pokeapi_app.app_schema.start_service(wh_name string, output_table_name string)

RETURNS STRING
LANGUAGE JAVASCRIPT
EXECUTE AS OWNER
AS $$
var create_task_cmd =
     "CREATE TASK IF NOT EXISTS time_schema.insert_time warehouse = "
        + WH_NAME
        + " SCHEDULE = '2 MINUTE'"
        + " as call source_pokeapi_app.app_schema.sync_connector_to_table('time_schema.output_table', {'pokemon_name': 'zapdos'})";

snowflake.execute({ sqlText: create_task_cmd });

snowflake.execute({ sqlText: `ALTER TASK time_schema.insert_time resume` });

return "SERVICE STARTED";
$$;

-- database role will be granted to APP_EXPORTER in installer script
CREATE or replace DATABASE ROLE source_pokeapi_app.shared_db_role;

GRANT USAGE ON DATABASE source_pokeapi_app TO
DATABASE ROLE source_pokeapi_app.shared_db_role;

GRANT USAGE ON SCHEMA source_pokeapi_app.app_schema TO
DATABASE ROLE source_pokeapi_app.shared_db_role;

GRANT USAGE ON PROCEDURE source_pokeapi_app.app_schema.start_service(string, string)
TO DATABASE ROLE source_pokeapi_app.shared_db_role;

-- TODO: this is a hack. the shared_role shouldn't have access to this!
GRANT USAGE ON PROCEDURE source_pokeapi_app.app_schema.sync_connector_to_table(string, object) TO DATABASE ROLE source_pokeapi_app.shared_db_role;
GRANT USAGE ON FUNCTION source_pokeapi_app.app_schema.SOURCE_POKEAPI_EXTERNAL_FUNCTION(STRING, string) TO DATABASE ROLE source_pokeapi_app.shared_db_role;

-- database role will not be granted to APP_EXPORTER in installer script
CREATE or replace DATABASE ROLE source_pokeapi_app.hidden_db_role;

GRANT USAGE ON DATABASE source_pokeapi_app TO
DATABASE ROLE source_pokeapi_app.hidden_db_role;

GRANT USAGE ON SCHEMA source_pokeapi_app.app_schema TO
DATABASE ROLE source_pokeapi_app.hidden_db_role;

GRANT USAGE ON PROCEDURE source_pokeapi_app.app_schema.sync_connector_to_table(string, object) TO DATABASE ROLE source_pokeapi_app.hidden_db_role;

-- Example of an installer script

CREATE or replace PROCEDURE source_pokeapi_app.app_schema.installer()
RETURNS STRING
LANGUAGE SQL
EXECUTE AS OWNER
AS $$
  begin
    CREATE or replace SCHEMA time_schema;
    CREATE TABLE time_schema.time_table(ts timestamp);
    CREATE or replace TABLE time_schema.output_table(data variant);
    GRANT USAGE ON schema time_schema TO DATABASE ROLE APP_EXPORTER;
    GRANT SELECT ON TABLE time_schema.time_table TO DATABASE ROLE APP_EXPORTER;
    GRANT SELECT ON TABLE time_schema.output_table TO DATABASE ROLE APP_EXPORTER;
    GRANT DATABASE ROLE shared_db_role TO DATABASE ROLE APP_EXPORTER;
    return 'installer script Done';
  end;
$$;

CREATE or replace SHARE source_pokeapi_share installer = source_pokeapi_app.app_schema.installer();

GRANT USAGE ON DATABASE source_pokeapi_app TO SHARE source_pokeapi_share;
GRANT USAGE ON SCHEMA source_pokeapi_app.app_schema TO SHARE source_pokeapi_share;
GRANT USAGE ON PROCEDURE source_pokeapi_app.app_schema.installer() TO SHARE source_pokeapi_share;
grant usage on function source_pokeapi_app.app_schema.source_request_translator(object) to share source_pokeapi_share;
grant usage on function source_pokeapi_app.app_schema.source_response_translator(object) to share source_pokeapi_share;
GRANT DATABASE ROLE source_pokeapi_app.hidden_db_role TO SHARE source_pokeapi_share;
GRANT DATABASE ROLE source_pokeapi_app.shared_db_role TO SHARE source_pokeapi_share;


--drop share source_pokeapi_share;

--call source_pokeapi_app.app_schema.sync_connector_to_table('output_table_name', {'pokemon_name': 'zapdos'})

call source_pokeapi_app.app_schema.sync_connector_to_table('time_schema.output_table', {'pokemon_name': 'zapdos'})