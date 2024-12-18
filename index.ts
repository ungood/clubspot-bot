import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Import the program's configuration settings.
const config = new pulumi.Config();
const appPath = config.get("appPath") || "./app";
const region = gcp.config.region!;

// Create another storage bucket for the serverless app.
const sourceArchiveBucket = new gcp.storage.Bucket("source-archive-bucket", {
    location: "US",
});

// Upload the serverless app to the storage bucket.
const sourceArchive = new gcp.storage.BucketObject("source-archive", {
    bucket: sourceArchiveBucket.name,
    name: "app.zip",
    source: new pulumi.asset.FileArchive(appPath),
});

// Create a Cloud Function that returns some data.
const exampleFunction = new gcp.cloudfunctionsv2.Function("example-function", {
    location: region,
    buildConfig: {
        runtime: "nodejs20",
        entryPoint: "date",
        source: {
            storageSource: {
                bucket: sourceArchiveBucket.name,
                object: sourceArchive.name,
            },
        },
    },
});

// This allows allUsers to invoke this function (which isn't very secure)
const invoker = new gcp.cloudfunctionsv2.FunctionIamMember("example-function-public", {
    project: exampleFunction.project,
    cloudFunction: exampleFunction.name,
    role: "roles/cloudfunctions.invoker",
    member: "allUsers",
});


export const apiURL = exampleFunction.url;
