// tslint:disable:object-literal-sort-keys
// tslint:disable-next-line:no-object-mutation
import axios from 'axios';
import commandLineArgs from 'command-line-args';

// tslint:disable-next-line:readonly-array
const optionDefinitions = [
  { name: 'sourceRegistry', alias: 'r', type: String },
  { name: 'localRegistry', alias: 'l', type: String }
];

const { sourceRegistry, localRegistry } = commandLineArgs(optionDefinitions);

/////////////////////////////////////////////////////////////////////////////////////
// Edit Configs Here                                                               //
/////////////////////////////////////////////////////////////////////////////////////

const topicsToCreate: ReadonlyArray<string> = [
  'test-identity',
  'test-eligibility',
  'test-eligibility-identity-align',
  'test-eligibility-identity-give',
  'test-eligibility-identity-core-idp'
];

/////////////////////////////////////////////////////////////////////////////////////
// Below is implementation only need to edit configs above (Unless there is a bug) //
/////////////////////////////////////////////////////////////////////////////////////

async function getSchemaFromSourceRegistry(subject: string) {
  return (await axios.get(
    `${sourceRegistry}/subjects/${subject}/versions/latest/schema`
  )).data;
}

async function uploadSchemaToLocalRegistry(subject: string, schema: any) {
  for (const index in schema.fields) {
    const field = schema.fields[index];
    if (
      Array.isArray(field.type) &&
      field.type.includes('null') &&
      typeof field.default === 'undefined'
    ) {
      // tslint:disable-next-line:no-object-mutation
      field.default = null;
    }
  }

  return axios.post(
    `${localRegistry}/subjects/${subject}/versions`,
    {
      schema: JSON.stringify(schema)
    },
    {
      headers: {
        'Content-Type': 'application/vnd.schemaregistry.v1+json'
      }
    }
  );
}

async function downloadSchemaFromSourceAndUploadToLocal(
  newLocalSubjectName: string,
  sourceSubject: string
) {
  const sourceSchema = await getSchemaFromSourceRegistry(sourceSubject);
  await uploadSchemaToLocalRegistry(newLocalSubjectName, sourceSchema);
}

async function getAllSchemasFromSource() {
  return (await axios.get(`${sourceRegistry}/subjects`)).data;
}

async function setupAllAvroSchemas() {
  const subjectsToCreate: ReadonlyArray<
    string
  > = await getAllSchemasFromSource();
  for (const index in subjectsToCreate) {
    const subject = subjectsToCreate[index];
    await downloadSchemaFromSourceAndUploadToLocal(subject, subject);
  }
}

async function createTopic(topicName: string) {
  const authToken = (await axios.post('http://localhost:3030/api/login', {
    password: 'admin',
    user: 'admin'
  })).data;
  const response = await axios.post(
    'http://localhost:3030/api/topics',
    {
      configs: {},
      partitions: 1,
      replication: 1,
      topicName
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-kafka-lenses-token': authToken
      },
      validateStatus: status => {
        return (status >= 200 && status < 300) || status === 400; // default
      }
    }
  );

  if (
    response.status === 400 &&
    response.data.includes('it ALREADY exists') === false
  ) {
    throw new Error(response.data);
  }
}

async function createAllTopics() {
  if (false) {
    for (const index in topicsToCreate) {
      await createTopic(topicsToCreate[index]);
    }
  }
}

async function definitelyNotMain() {
  try {
    await createAllTopics();
    await setupAllAvroSchemas();
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

export default definitelyNotMain;
