'use strict';

require('babel-polyfill')

const express = require('express');
const asyncify = require('express-asyncify');
const app = asyncify(express()),
    bodyParser = require('body-parser');
const Export = require('./Export');
const crypto = require('crypto');
const TableHandler = require('./TableHandler');
const _ = require('lodash');
const XLSX = require('xlsx')

const exportOutput = async(accesskey, secretaccesskey, region) => {
    let result;
    try {
        const exporter = new Export();
        result = await exporter.run(accesskey, secretaccesskey, region);
    } catch (err) {
        console.error(err)
    };
    return result;
}


app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/process', async(req, res) => {
    let data = [req.body.accesskey, req.body.secretaccesskey, req.body.region]
    let hmac = crypto.createHmac('sha256', 'password')
    let id = hmac.update(JSON.stringify(data)).digest('hex');
    const output = await exportOutput(...data);
    let redirectUrl = '/' + id
    const table = new TableHandler();
    table.putRow(id, JSON.stringify(output), output.importMetaData.timeStamp);
    res.redirect(redirectUrl);
});

app.post('/:id/refresh', async(req, res) => {
    const output = await exportOutput(...data);
    let id = req.params.id;
    let redirectUrl = '/' + id
    const table = new TableHandler();
    table.putRow(id, JSON.stringify(output), output.importMetaData.timeStamp);
    res.redirect(redirectUrl);
});

app.get('/:id', async(req, res) => {
    let id = req.params.id;
    const table = new TableHandler();
    table.getRow(id).then((item) => {
        let result = {};
        console.log(12);
        console.log(typeof item);
        result = JSON.parse(item.body);

        res.render(__dirname + "/views/vpcs.ejs", {
            id: id,
            importedAt: item.importedAt,
            result: result,
        });
    });
});

app.get('/:id/:vpc', async(req, res) => {
    let vpc = req.params.vpc;
    let id = req.params.id;
    let subnets = [];
    let subnetHash = {};
    const table = new TableHandler();
    table.getRow(id).then((item) => {
        let result = {};

        console.log(typeof item);

        result = JSON.parse(item.body);

        for (let row of result.subnets.Subnets) {
            if (row.VpcId === vpc) {
                subnets.push(row.SubnetId);
                subnetHash[row.SubnetId] = vpc;
            }
        }

        res.render(__dirname + "/views/all.ejs", {
            id: id,
            item: item,
            result: result,
            vpc: vpc,
            subnets: subnets,
            subnetHash: subnetHash,
            blank: ''
        });
    });
});

app.get('/', function(req, res) {
    res.render(__dirname + "/views/index.ejs");
});

app.get('*', function(req, res) {
    res.send('404 @ 그리고 아무일도 일어나지 않았다.', 404);
})

const port = process.env.PORT || 80
app.listen(port, () =>
    console.log(`Server is listening on port ${port}.`)
)