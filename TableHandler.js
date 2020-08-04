const AWS = require("aws-sdk");

class TableHandler {
    constructor() {
        AWS.config.update({
            accessKeyId: 'AKIA5FGOFZR7MMOHGZ5Y',
            secretAccessKey: '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',
            region: "ap-northeast-2"
        });
    };

    getIdCount(id) {
        const params = {
            TableName: 'idexport',
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ":id": id
            }
        };


        let docClient = new AWS.DynamoDB.DocumentClient();
        return new Promise((resolve, reject) => {
            docClient.query(params).promise().then((data) => {
                resolve(data.Count);
            });
        });
    }

    getRow(id) {
        const params = {
            TableName: 'idexport',
            Key: {
                id: id
            }
        };
        let docClient = new AWS.DynamoDB.DocumentClient();

        return new Promise((resolve, reject) => {
            docClient.get(params).promise().then((data) => {
                resolve(data.Item)
            });
        });

    }

    putRow(id, body, importedAt) {
        const params = {
            TableName: 'idexport',
            Item: {
                "id": id,
                "body": body,
                "importedAt": importedAt
            }
        };
        let docClient = new AWS.DynamoDB.DocumentClient();
        return docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        });
    }

}

module.exports = TableHandler;