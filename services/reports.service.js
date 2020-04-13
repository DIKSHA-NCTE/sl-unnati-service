/**
 * @reports.service.js
 *
 * api related functionalities are written below
 */

/**
 * Loading Application level configuration data
 */
var config = require('../config/config.json');
var winston = require('../config/winston');
var userEntities = require('../helpers/user-entities');

var mongoose = require('../node_modules/mongoose');
var moment = require('moment');

var solutionsModel = require('../models/solutions.js');
var projectsModel = require('../models/projects.js');
var taskModel = require('../models/task.js');
var programsModel = require('../models/programs.js');
var httpRequest = require('../helpers/http-request')





/**
 * Loading external libraries used
 */
var request = require('request');

var _this = this;
var api = {};
api.getReports = getReports;
api.getObservationReport = getObservationReport;
api.getMonthViseReport = getMonthViseReport;
api.getDetailViewReport = getDetailViewReport;
api.getMonthlyOrQuarterReportPdf = getMonthlyOrQuarterReportPdf;
api.numberOfProjectsPerUser = numberOfProjectsPerUser;
api.getFullMonthlyOrQuarterPdf = getFullMonthlyOrQuarterPdf;
api.shareTaskPdf = shareTaskPdf;

module.exports = api;

/**
 * 
 * @param {*} getReports api is used to get the reports of all scholl names with observation names 
 */
async function getReports(req) {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await userEntities.userEntities(req);

            // console.log("data --",data);
            if (data.status == "success") {
                let result = JSON.parse(data.data).result;


                // console.log("profileData",data.profileData.result);


                let arrayOfEntity = [];
                await Promise.all(result.map(async ele => {
                    arrayOfEntity.push(ele._id);
                }));
                console.log("arrayOfEntity", arrayOfEntity);


                // arrayOfEntity = ["5c70d7d92da51f754ca01f39", "5cebbefe5943912f56cf8e16", "5c6ce843723d0b1ecde8b2e8"]
                let reqBody = {
                    "entityIds": arrayOfEntity
                }

                if (req.query.search) {
                    reqBody.search = req.query.search;
                    reqBody.entityType = data.profileData.result.roles[0].entities[0].entityType;
                    reqBody.queryId = data.profileData.result.roles[0].entities[0]._id;
                }

                console.log("reqBody", reqBody);

                let url = config.dhiti_config.api_base_url + config.dhiti_config.observationsByEntity;
                request({
                    headers: {
                        'x-auth-token': req.headers['x-auth-token'],
                        'Content-Type': 'application/json',
                    }, url: url, method: 'POST', json: reqBody
                }, async function (error, httpResponse, body) {
                    if (error) {
                        let obj = {
                            status: "failed",
                            // message: "failed during fetching school details ",
                            errorObject: error,
                            message: error.message,
                            stack: error.stack
                        };
                        winston.error(obj);
                        return resolve(obj);
                    }

                    let responseObj = [];
                    // console.log("body.data",body);

                    if (body) {
                        await Promise.all(body.map(function (ele) {

                            // var time = "";
                            // if(ele.event.createdAt){
                            //     time = ele.event.createdAt;
                            // }
                            var obserationInfo = {
                                "observationName": ele.event.observationName,
                                "observationSubmissionId": ele.event.observationSubmissionId,
                                "entityId": ele.event.entityId,
                                "entityName": ele.event.entityName,
                                "date": ele.event.createdAt

                            }
                            responseObj.push(obserationInfo);
                        }));
                        return resolve({
                            status: "success",
                            message: "successfully got obseration By entity",
                            data: responseObj

                        })
                    } else {
                        return resolve({
                            status: "failed",
                            message: body.message,
                            data: "data not found"

                        })
                    }

                });
            } else {

                // console.log("asdasd");
                return resolve({
                    status: "failed",
                    message: "Data not found"
                })
            }
        } catch (error) {
            return reject({
                status: "failed",
                message: error,
                errorObject: error
            });
        }
        finally {
        }
    });
}

/**
 * getObservationReport is used to get the pdf report for instance level
 * it communicate with the dithi service to get the pdf
 * @param {*} req
 */
async function getObservationReport(req) {
    return new Promise(async (resolve, reject) => {
        try {

            let id = req.query.observationId;
            console.log("req", id);



            let url = config.dhiti_config.api_base_url + config.dhiti_config.instanceLevelPdfReports + '?submissionId=' + id;

            console.log("url", url);
            request({
                headers: {
                    'x-auth-token': req.headers['x-auth-token'],
                }, url: url,
            }, async function (error, httpResponse, body) {
                if (error) {
                    let obj = {
                        status: "failed",
                        // message: "failed during fetching school details ",
                        errorObject: error,
                        message: error.message,
                        stack: error.stack
                    };
                    winston.error(obj);
                    return reject(obj);
                };


                return resolve(body)
            });
        } catch (error) {
            return reject({
                status: "failed",
                message: error,
                errorObject: error
            });
        }
        finally {
        }
    });
}


/**
 * getMonthViseReport is used to get the report of last Month or last quarter
 * @param {*} req
 */
async function getMonthViseReport(req) {
    return new Promise(async (resolve, reject) => {
        try {
            let projectQuery =  {
                userId: req.body.userId,
                isDeleted: { $ne:true } };
            
            if(req.query.entityId){
                projectQuery["entityId"] =  req.query.entityId;
            }

            let projectsData = await projectsModel.find(projectQuery,{ _id:1,status:1,title:1 });
            
            var endOf = "";
            var startFrom = "";
            if (req.query.reportType == "lastQuarter") {
                endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
            } else {
                endOf = moment().subtract(0, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(0, 'months').startOf('month').format('YYYY-MM-DD');
                let currentDate = moment().format('YYYY-MM-DD');
                if (currentDate != endOf) {
                    endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                    startFrom = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
                }
            }
   
            let projectCompleted = 0
            let projectPending = 0;
            let taskCompleted = 0;
            let taskPending = 0;

            let taskCount = 0;

            if (projectsData.length > 0) {
                await Promise.all(
                    projectsData.map(async projectList => {
                        let taskData = await taskModel.find({
                            projectId: projectList._id, isDeleted: { $ne: true }, $or: [
                                { lastSync: { $gte: startFrom, $lte: endOf } },
                                { "subTasks.lastSync": { $gte: startFrom, $lte: endOf } }
                            ]
                        });
                        if (taskData.length > 0) {

                            await Promise.all(taskData.map(async taskList => {
                                taskCount = taskCount + 1;
                                let status = (taskList.status).toLowerCase();
                                if (status == "completed") {
                                    taskCompleted = taskCompleted + 1;
                                } else {
                                    taskPending = taskPending + 1;
                                }
                            }
                            ));

                        }
                        
                        let projectStatus = ""
                        if(projectList.status){
                            projectStatus = projectList.status.toLowerCase();
                        }
                        if (projectStatus == "completed") {
                            projectCompleted = projectCompleted + 1;
                            } else {
                                projectPending = projectPending + 1;
                            }
                        
                    })
                );

                let data = {
                    projectsCompleted: projectCompleted,
                    projectsPending: projectPending,
                    tasksCompleted: taskCompleted,
                    tasksPending: taskPending,
                    endMonth: moment(endOf).format('MMMM'),
                    startMonth: moment(startFrom).format('MMMM')
                }

                resolve({ status: "success", data: data, message: "Report Generated Succesfully " });
            } else {
                reject({ status: "failed", "message": "no data found", data: [] })
            }
        } catch (ex) {
            winston.error({ "error": ex, "where": "getMonthViseReport api " });
            reject({ status: "failed", "message": ex })
        }
    });
}


/**
 * getDetailViewReport is used to return the complete details of lastmonth or quarter data to generate the chart
 * @param {*} req
 */
async function getDetailViewReport(req) {
    return new Promise(async (resolve, reject) => {
        try {
            let projectQuery =  {
                userId: req.body.userId,
                isDeleted: { $ne:true } };
            if(req.query.entityId){
                projectQuery["entityId"] =  req.query.entityId;
            }

            let projectsData = await projectsModel.find(projectQuery,{ _id:1,title:1 });


            let chartObject = [];
            var endOf = "";
            var startFrom = "";
          
            if (req.query.reportType == "lastQuarter") {
                endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
            } else {
                endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
            }

            if (projectsData.length > 0) {
                await Promise.all(
                    projectsData.map(async projectList => {
                        let taskData = await taskModel.find({
                            projectId: projectList._id, isDeleted: { $ne: true }, $or: [
                                { lastSync: { $gte: startFrom, $lte: endOf } },
                                { "subTasks.lastSync": { $gte: startFrom, $lte: endOf } }
                            ]
                        });

                        let reponseObj = {
                            title: {
                                text: projectList.title
                            },
                            series: [{
                                name: projectList.title,
                                data: []
                            }],
                            xAxis: {

                            }
                        };
                        reponseObj.series[0].data = [];
                        reponseObj.xAxis.min = "";
                        reponseObj.xAxis.max = "";
                        reponseObj.series[0].name = projectList.title;
                        if (taskData.length > 0) {  
                            await Promise.all(taskData.map(async taskList => {
                                let status = (taskList.status).toLowerCase();
                                
                                if (reponseObj.xAxis.min != "" && reponseObj.xAxis.max != "") {
                                    if (moment(reponseObj.xAxis.min) > moment(taskList.startDate)) {
                                        reponseObj.xAxis.min = taskList.startDate;
                                    }
                                    if (moment(reponseObj.xAxis.max) > moment(taskList.endDate)) { } else {
                                        reponseObj.xAxis.max = taskList.endDate;
                                    }
                                } else {
                                    reponseObj.xAxis.min = taskList.startDate;
                                    reponseObj.xAxis.max = taskList.endDate;
                                }

                                let color = "";
                                if (status == "not yet started" || status == "not started yet") {
                                    color = "#f5f5f5";
                                } else if (status == "completed") {
                                    color = "#20ba8d";
                                } else if (status == "inprogress") {
                                    color = "#ef8c2b";
                                }
                                let obj = {
                                    name: taskList.title,
                                    id: taskList._id,
                                    color: color,
                                    start: moment.utc(taskList.startDate).valueOf(),
                                    end: moment.utc(taskList.endDate).valueOf()
                                }

                                reponseObj.xAxis.min = moment.utc(reponseObj.xAxis.min).valueOf('YYYY,mm,DD');
                                reponseObj.xAxis.max = moment.utc(reponseObj.xAxis.max).valueOf('YYYY,mm,DD');
                                reponseObj.series[0].data.push(obj);
                            })
                            )
                            chartObject.push(reponseObj);
                        }
                    })
                )
                resolve({ status: "success", "message": "Chart details generated succesfully", data: chartObject })
            } else {
                reject({ status: "failed", "message": "no data found", data: [] })
            }
        } catch (ex) {
            console.log("ex", ex);
            reject({ status: "failed", "message": "no data found", data: [], error: ex });
        }
    }
    );
}



/**
 * getMonthlyOrQuarterReportPdf is used to get the complete details of lastmonth or
 *  quarter data pdf
 * @param {*} req
 */
async function getMonthlyOrQuarterReportPdf(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            // let reportData = await getMonthViseReport(req, res);

            let type = "Monthly";
            if (req.query.reportType && req.query.reportType == "lastQuarter") {
                type = "Quarter";
            }
            let data = await monthOrQuarterData(req, res);
            if (data && data.length > 0) {

                // console.log("data",data.length);
                let requestBody = {
                    "schoolName": req.query.schoolName,
                    "reportType": type,
                    "projectDetails": data
                }
                let headers = {
                    'x-auth-token': req.headers['x-auth-token'],
                    'Content-Type': 'application/json'
                }
                // console.log("requestBody", requestBody);
                let url = config.dhiti_config.api_base_url + config.dhiti_config.monthlyReportPdf;
                let response = await httpRequest.httpsPost(headers, requestBody, url);


                if (response) {

                    console.log("response", response);
                    resolve(response);
                } else {

                    winston.error("from monthly report api" + response);
                    resolve(response)
                }

            } else {
                resolve({ status: "failed", message: "No data Found" });
            }

        } catch (error) {
            winston.error("error occured at getMonthViseReportPdf() in report.service.js " + error);
            reject({ status: "failed", "message": "no data found", data: [] })
        }

    });
}



/**
 * monthOrQuarterData func() returns the last month or quarter data of 
 * specific user
 *  data pdf
 * 
 * @param {*} req
 */
async function monthOrQuarterData(req, res) {
    return new Promise(async (resolve, reject) => {
        try {

            let query = {};
            if (req.query.entityId) {
                query = { "userId": req.body.userId, "entityId": req.query.entityId, isDeleted: { $ne: true } };
            } else {
                query = { "userId": req.body.userId, isDeleted: { $ne: true } };
            }

            let projectsData = await projectsModel.find(query, { title: 1, _id: 1, startDate: 1, endDate: 1, status: 1 }).lean();

            if (req.query && req.query.reportType && req.query.reportType == "lastQuarter") {
                endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
            } else {
                endOf = moment().subtract(0, 'months').endOf('month').format('YYYY-MM-DD');
                startFrom = moment().subtract(0, 'months').startOf('month').format('YYYY-MM-DD');
                let currentDate = moment().format('YYYY-MM-DD');
                if (currentDate != endOf) {
                    endOf = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
                    startFrom = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
                }
            }

            let ArrayOfProjects = [];

            if (projectsData.length > 0) {

                await Promise.all(
                    projectsData.map(async projectList => {
                        let taskData = await taskModel.find({
                            projectId: projectList._id, isDeleted: { $ne: true }, $or: [
                                { lastSync: { $gte: startFrom, $lte: endOf } },
                                { "subTasks.lastSync": { $gte: startFrom, $lte: endOf } }
                            ]
                        }, { "title": 1, "status": 1, "_id": 1, "startDate": 1, "endDate": 1, "subTasks.title": 1, "subTasks._id": 1, "assigneeName": 1 }).lean();
                        if (taskData.length > 0) {

                            
                       

                            let allTasks = [];
                            await Promise.all(taskData.map(async function (taskList, index) {

                                console.log(taskData.length, "taskList", taskList);
                                
                                if (taskData[index].file) {
                                    delete taskData[index].file;
                                }
                                if (taskData[index].imageUrl) {
                                    delete taskData[index].imageUrl;
                                }

                                allTasks.push(taskData);

                            }));
                            projectList.tasks = allTasks;
                            ArrayOfProjects.push(projectList);

                        } else {
                            projectList.tasks = [];
                            ArrayOfProjects.push(projectList);
                        }
                    }));

                console.log(ArrayOfProjects.length, "ArrayOfProjects =====", ArrayOfProjects);
                resolve(ArrayOfProjects);
            } else {
                resolve(ArrayOfProjects);
            }
        } catch (error) {
            winston.error("error while gettting data for last month or quarter " + error)
            reject(error);
        }
    })
}


/**
 * numberOfProjectsPerUser func() return the report of number 
 * of projects created by specific user
 *  data pdf
 * 
 * @param {*} req
 */
async function numberOfProjectsPerUser(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            let userDetails = await projectsModel.aggregate([
                //   { $match:{ "createdType":"by self" } },
                {
                    $lookup: {
                        from: "userProjectsTasks",
                        localField: "_id",
                        foreignField: "projectId",
                        as: "taskList"

                    }
                },
                {
                    $group: {
                        _id: { "userId": "$userId" },
                        count: { $sum: 1 }
                    }
                }
            ]);
            let headers = {
                'X-authenticated-user-token': req.headers['x-auth-token'],
            }
            let url = config.kendra_config.base + config.kendra_config.getProfile;
            await Promise.all(userDetails.map(async function (item, index) {

                url = url + '/' + item._id.userId;
                let data = await httpRequest.httpsGet(headers, url);
                if (data && data !== "Not Found") {
                    data = JSON.parse(data);
                    if (data.result && data.result.firstName) {
                        lastName = data.result.lastName ? data.result.lastName : "";
                        let name = data.result.firstName + " " + lastName;
                        userDetails[index]["_id"].username = name;
                    }
                }
            }));
            resolve({ status: "success", data: userDetails });
        } catch (error) {
            winston.error(error);
            reject({ status: "failed", message: error });
        }
    });
}



/**
 * getFullMonthlyOrQuarterPdf is used to get the complete details of lastmonth or
 *  quarter data pdf
 * @param {*} req
 */
async function getFullMonthlyOrQuarterPdf(req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let type = "Monthly";
            if (req.query.reportType && req.query.reportType == "lastQuarter") {
                type = "Quarter";
            }
            let data = await monthOrQuarterData(req, res);
            if (data && data.length > 0) {

               let requestBody =  {
                    "schoolName" : req.query.schoolName,
                    "reportType": type,
                    "projectDetails": data
                }

                let headers = {
                    'x-auth-token': req.headers['x-auth-token'],
                    'Content-Type': 'application/json'
                }

                let url = config.dhiti_config.api_base_url + config.dhiti_config.fullMonthlyOrQueterlyReport;
                let response = await httpRequest.httpsPost(headers, requestBody, url);

                if (response) {

                    resolve(response);
                } else {

                    winston.error("from monthly report api" + response);
                    resolve(response)
                }

            } else {
                resolve({ status: "failed", message: "No data Found" });
            }

        } catch (error) {
            winston.error("error occured at getMonthViseReportPdf() in report.service.js " + error);
            reject({ status: "failed", "message": "no data found", data: [] })
        }

    });
}


/**
 * shareTaskPdf is used to share the task details
 * 
 * @param {*} req
 */
async function shareTaskPdf(req, res) {
    return new Promise(async (resolve, reject) => {
        try {

            let headers = {
                'x-auth-token': req.headers['x-auth-token'],
                'Content-Type': 'application/json'
            }

            let url = config.dhiti_config.api_base_url + config.dhiti_config.shareTaskPdf;
            let response = await httpRequest.httpsPost(headers, req.body, url);

            if (response) {
                resolve(response);
            } else {

                winston.error("share task report api" + response);
                resolve(response)
            }

        } catch (error) {
            winston.error("error occured at shareTaskPdf() in report.service.js " + error);
            reject({ status: "failed", "message": "failed to generate pdf",  })
        }

    })
}
