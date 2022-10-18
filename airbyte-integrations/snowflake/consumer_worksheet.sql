-- create integration
use role ACCOUNTADMIN;
create or replace api integration test_api_integration
  api_provider = aws_api_gateway
  api_aws_role_arn = 'arn:aws:iam::168714685353:role/snowflake-api-gateway-test'
  api_allowed_prefixes = ('https://w72cfwmned.execute-api.us-west-1.amazonaws.com/stage')
  enabled = true;


describe integration test_api_integration;

/*
-- create response translator   (old)
create or replace function aws_response_translator(event object)
returns object
language javascript as
'
var records = []
for(i = 0; i < EVENT.body.length; i++) {
   let row = EVENT.body[i];
   records.push([i, row]);
}
return { "body": { "data" : [[0, {"status": "ok"}] ]} };
';
*/

create or replace secret service_now_creds_pw
    type = password
    username = 'jsmith1'
    password = 'W3dr@fg*7B1c4j';

-- create request translator
create or replace function aws_request_translator(event object)
returns object
language javascript as
'
fullUrl = EVENT.body.data[0][2]
suffixUrl = "/" + EVENT.body.data[0][2].replace(EVENT.serviceURL, "")
return { "body": EVENT.body.data[0][1], "urlSuffix": suffixUrl};
';

-- create response translator
create or replace function aws_response_translator(event object)
returns object
language javascript as
'
return { "body": { "data" : [[0, EVENT]] }};
';

-- create external function
create or replace external function test_external_function(body varchar, urlSuffix varchar)
  returns variant
  api_integration = test_api_integration
  request_translator = aws_request_translator
  response_translator = aws_response_translator
  as 'https://w72cfwmned.execute-api.us-west-1.amazonaws.com/stage';

-- describe function
describe function test_external_function();

-- call external function
select test_external_function('', '/pokemon/pikachu');

select current_account();

-- create external function with request translator
create or replace external function test_external_function_with_request_translator(body varchar, urlSuffix varchar)
  returns variant
  api_integration = test_api_integration
  request_translator = aws_request_translator
  response_translator = aws_response_translator
  as 'https://w72cfwmned.execute-api.us-west-1.amazonaws.com/stage';

select test_external_function_with_request_translator('{"body": "hello"}', 'suffix');
select aws_request_translator(parse_json('{"body": {"data": [ [0,"", "https://pokeapi/v2/pokemon/mewtwo"]] }, "serviceURL": "https://pokeapi/v2/"}'));



----

select source_pokeapi_external_function('', 'https://pokeapi/v2/pokemon/mewtwo');
describe function source_pokeapi_external_function(varchar, varchar);

select current_account();

-- Consumers: Using a snowflake native applications
CREATE ROLE app_role;
GRANT EXECUTE TASK ON ACCOUNT to ROLE app_role;
GRANT USAGE ON WAREHOUSE compute_wh TO ROLE app_role;
GRANT ROLE app_role to database time_app_share_1;

CALL time_app_share_1.app_schema.start_service('compute_wh');
SELECT * FROM time_app_share_1.time_schema.time_table;


select *
  from table(information_schema.task_history())
  order by scheduled_time;
-- wait until 12:28 to see updated status

DROP DATABASE time_app_share_1;


-- register
CREATE or replace ROLE app_role;
GRANT EXECUTE TASK ON ACCOUNT to ROLE app_role;
GRANT USAGE ON WAREHOUSE compute_wh TO ROLE app_role;
GRANT ROLE app_role TO DATABASE source_pokeapi_share;

--create schema pokemon;
--create table if not exists pokemon.test_pokeapi (data variant);
CALL source_pokeapi_share.app_schema.start_service('compute_wh', 'time_schema.output_table');
create table source_pokeapi_share.pokemon(data variant);

alter database SOURCE_POKEAPI_SHARE set FIREWALL_CONFIGURATION = ('https://w72cfwmned.execute-api.us-west-1.amazonaws.com/stage');
CALL source_pokeapi_share.app_schema.sync_connector_to_table('time_schema.output_table', {'pokemon_name': 'zapdos'});

select *
  from table(information_schema.task_history())
  where database_name = 'SOURCE_POKEAPI_SHARE'
  order by scheduled_time;

select *
  from table(information_schema.query_history()) where query_id = '01a7b2d6-0000-c7d6-0002-c0a60003a79e' order by 'start_time';

select * from time_schema.output_table;