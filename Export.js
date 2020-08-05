require('babel-polyfill')

const AWS = require('aws-sdk');
const _ = require('lodash');
var awsConfig = require('aws-config');

class Export {
    constructor(accessKey, secretAccessKey, region) {
        this.output = {};
        this.accessKey = accessKey;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
    }

    cleanResponse(resp) {
        delete resp['ResponseMetadata'];
        return resp;
    }

    async getInfo(err, data) {
        const self = this;

        const ec2 = new AWS.EC2();
        this.output.ec2 = await ec2.describeInstances().promise();
        this.output.securitygroups = await ec2.describeSecurityGroups().promise();
        this.output.subnets = await ec2.describeSubnets().promise();
        this.output.acls = await ec2.describeNetworkAcls().promise();
        this.output.vpc = await ec2.describeVpcs().promise();
        this.output.routetables = await ec2.describeRouteTables().promise();
        this.output.natgw = await ec2.describeNatGateways().promise();
        this.output.ebs = await ec2.describeVolumes().promise();

        const elb = new AWS.ELB();
        this.output.elb = this.cleanResponse(await elb.describeLoadBalancers().promise());

        const elbv2 = new AWS.ELBv2();
        let outputElbv2 = {};
        outputElbv2.LoadBalancers = this.cleanResponse(await elbv2.describeLoadBalancers().promise());
        outputElbv2.TargetGroups = this.cleanResponse(await elbv2.describeTargetGroups().promise());
        outputElbv2.TargetHealthDescriptions = {};
        for (let row of outputElbv2.TargetGroups.TargetGroups) {
            outputElbv2.TargetHealthDescriptions[row.TargetGroupArn] = (await elbv2.describeTargetHealth({
                TargetGroupArn: row.TargetGroupArn
            }).promise()).TargetHealthDescriptions;
        }

        this.output.elbv2 = outputElbv2;

        const autoscaling = new AWS.AutoScaling();
        this.output.autoscale = this.cleanResponse(await autoscaling.describeAutoScalingGroups().promise());
        this.output.launchconfig = this.cleanResponse(await autoscaling.describeLaunchConfigurations().promise());

        const s3 = new AWS.S3();
        this.output.s3 = {};

        let S3Buckets = [];
        let S3BucketInfo = await s3.listBuckets().promise();
        for (let row of S3BucketInfo.Buckets) {
            let BucketName = row.Name;
            let BucketLocInfo, BucketACLInfo, IsBucketPublic;
            try {
                BucketLocInfo = await s3.getBucketLocation({ Bucket: BucketName }).promise();
                BucketACLInfo = await s3.getBucketAcl({ Bucket: BucketName }).promise();
                IsBucketPublic = BucketACLInfo.Grants.find((item) => { return item.Grantee.URI && item.Grantee.URI === "http://acs.amazonaws.com/groups/global/AllUsers" }) ? true : false;
            } catch (exception) {}

            if (!BucketLocInfo) continue;

            S3Buckets.push({
                Name: BucketName,
                Region: BucketLocInfo.LocationConstraint,
                IsPublic: IsBucketPublic,
                CreationDate: row.CreationDate,
            });
        }
        this.output.s3 = { Buckets: S3Buckets };

        const rds = new AWS.RDS();
        this.output.rds = this.cleanResponse(await rds.describeDBInstances().promise());

        const elasticache = new AWS.ElastiCache();
        this.output.elasticache = this.cleanResponse(await elasticache.describeCacheClusters().promise());
        let ElastiCacheSubnetGroups = this.cleanResponse(await elasticache.describeCacheSubnetGroups().promise());
        let ElastiCacheReplicationGroups = this.cleanResponse(await elasticache.describeReplicationGroups().promise());

        let elcSubnetGroupMap = {};
        for (let row of ElastiCacheSubnetGroups.CacheSubnetGroups) {
            elcSubnetGroupMap[row.CacheSubnetGroupName] = {
                Name: row.CacheSubnetGroupName,
                VpcId: row.VpcId,
                SubnetIds: [row.Subnets.map((r) => r.SubnetIdentifier)]
            };
        }

        let elcReplicationGroupMap = {};
        for (let row of ElastiCacheReplicationGroups.ReplicationGroups) {
            elcReplicationGroupMap[row.ReplicationGroupId] = row.NodeGroups;
        }

        let NewElastiCacheRows = [];
        for (let row of this.output.elasticache.CacheClusters) {
            row.CacheSubnetGroup = elcSubnetGroupMap[row.CacheSubnetGroupName];
            row.ReplNodeGroups = elcReplicationGroupMap[row.ReplicationGroupId];
            NewElastiCacheRows.push(row);
        }

        this.output.elasticache.CacheClusters = NewElastiCacheRows;

        const cloudfront = new AWS.CloudFront();
        this.output.cloudfront = await cloudfront.listDistributions().promise();

        const efs = new AWS.EFS();
        this.output.efs = await efs.describeFileSystems().promise();

        let date = new Date();
        this.output.importMetaData = { 'region': this.region, 'timeStamp': new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toJSON() };

        return new Promise((resolve, reject) => {
            resolve(self.output);
        });
    }

    run(accessKey, secretAccessKey, region) {
        const context = this;
        this.accessKey = accessKey;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        AWS.config.update({ accessKeyId: accessKey, secretAccessKey: secretAccessKey, region: region });

        return context.getInfo(accessKey, secretAccessKey, region)
            .then((result) => {
                return result;
            });
    }
}

module.exports = Export;