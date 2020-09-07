/**
 * name : categories.js
 * author : Aman
 * created-date : 16-July-2020
 * Description : Library categories related information.
 */

// Dependencies

const libraryCategoriesHelper = require(MODULES_BASE_PATH + "/library/categories/helper");

 /**
    * LibraryCategories
    * @class
*/

module.exports = class LibraryCategories extends Abstract {
    
    constructor() {
        super("project-categories");
    }

    static get name() {
        return "libraryCategories";
    }

     /**
     * @apiDefine errorBody
     * @apiError {String} status 4XX,5XX
     * @apiError {String} message Error
     */

    /**
     * @apiDefine successBody
     * @apiSuccess {String} status 200
     * @apiSuccess {String} result Data
     */

    /**
    * @api {get} /improvement-projects/api/v1/library/categories/list List of library categories.
    * @apiVersion 1.0.0
    * @apiName List of library categories
    * @apiGroup Library Categories
    * @apiSampleRequest /improvement-projects/api/v1/library/categories/list
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    * "message": "Library categories fetched successfully",
    * "status": 200,
    * "result": [
    * {
            "name": "Community",
            "type": "community",
            "updatedAt": "2020-07-16T09:51:43.533Z",
            "url": "https://storage.googleapis.com/download/storage/v1/b/sl-dev-storage/o/static%2FprojectCategories%2Fdrafts.png?generation=1594893105112980&alt=media"
        },
        {
            "name": "Infrastructure",
            "type": "infrastructure",
            "updatedAt": "2020-07-16T09:51:43.533Z",
            "url": "https://storage.googleapis.com/download/storage/v1/b/sl-dev-storage/o/static%2FprojectCategories%2FobservationSolutions.png?generation=1594893104772103&alt=media"
        },
        {
            "name": "Students",
            "type": "students",
            "updatedAt": "2020-07-16T09:51:43.533Z",
            "url": "https://storage.googleapis.com/download/storage/v1/b/sl-dev-storage/o/static%2FprojectCategories%2FinstitutionalAssessments.png?generation=1594893104496585&alt=media"
        },
        {
            "name": "Teachers",
            "type": "teachers",
            "updatedAt": "2020-07-16T09:51:43.533Z",
            "url": "https://storage.googleapis.com/download/storage/v1/b/sl-dev-storage/o/static%2FprojectCategories%2FindividualAssessments.png?generation=1594893104067373&alt=media"
        }
    ]}
    */

      /**
      * List of library categories
      * @method
      * @name list
      * @returns {JSON} returns a list of library categories.
     */

    async list() {
        return new Promise(async (resolve, reject) => {
            try {
                
                const projectCategories = await libraryCategoriesHelper.list();
                return resolve(projectCategories);

            } catch (error) {
                return reject({
                    status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
                    message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
                    errorObject: error
                });
            }
        })
    }


    /**
    * @api {get} /improvement-projects/api/v1/library/categories/projects/:categoryExternalId?page=:page&limit=:limit&search=:search&sort=:sort List of library projects.
    * @apiVersion 1.0.0
    * @apiName List of library projects
    * @apiGroup Library Categories
    * @apiSampleRequest /improvement-projects/api/v1/library/categories/projects/community?page=1&limit=1&search=t&sort=importantProject
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched projects",
    "status": 200,
    "result": [
        {
            "_id": "5f4c91b0acae343a15c39357",
            "averageRating": 2.5,
            "noOfRatings": 4,
            "name": "Test-template",
            "externalId": "Test-template1",
            "description" : "Test template description",
            "createdAt": "2020-08-31T05:59:12.230Z"
        }
    ],
    "count": 7
    }
    */

      /**
      * List of library projects
      * @method
      * @name projects
      * @param {Object} req - requested data
      * @returns {JSON} returns a list of library projects.
     */

    async projects(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                const libraryProjects = 
                await libraryCategoriesHelper.projects(
                    req.params._id,
                    req.pageSize,
                    req.pageNo,
                    req.searchText,
                    req.query.sort
                );
                
                return resolve(libraryProjects);

            } catch (error) {
                return reject(error);
            }
        })
    }

      /**
    * @api {get} /improvement-projects/api/v1/library/categories/projectDetails/:projectId Library projects details.
    * @apiVersion 1.0.0
    * @apiName Library projects details.
    * @apiGroup Library Categories
    * @apiSampleRequest /improvement-projects/api/v1/library/categories/projectDetails/5f2ab0a33f623cb3b25c846a
    * @apiUse successBody
    * @apiUse errorBody
    * @apiParamExample {json} Response:
    * {
    "message": "Successfully fetched projects",
    "status": 200,
    "result": 
    {
            "_id": "5f2ab0a33f623cb3b25c846a",
            "status": "pending",
            "createdAt": "2020-06-29T05:38:43.408Z",
            "lastDownloadedAt": "2020-06-29T05:38:43.408Z",
            "syncedAt": "2020-06-29T05:38:43.408Z",
            "isDeleted": false,
            "category": [
                {
                    "_id": "5f102331665bee6a740714e9",
                    "name": "Students",
                    "externalId": "students"
                }
            ],
            "createdBy": "e97b5582-471c-4649-8401-3cc4249359bb",
            "startedAt": "2020-06-29T05:38:43.408Z",
            "completedAt": "2020-06-29T05:38:43.408Z",
            "tasks": [
                {
                    "_id": "5f24404784504944928b10bc",
                    "isDeleted": false,
                    "isDeleteable": false,
                    "taskSequence": [],
                    "children": [
                        {
                            "_id": "5f24404784504944928b10bd",
                            "createdBy": "e97b5582-471c-4649-8401-3cc4249359bb",
                            "updatedBy": "e97b5582-471c-4649-8401-3cc4249359bb",
                            "isDeleted": false,
                            "isDeleteable": false,
                            "taskSequence": [],
                            "children": [],
                            "deleted": false,
                            "type": "single",
                            "projectTemplateId": "5f2402f570d11462f8e9a591",
                            "name": "Sub-Task-4",
                            "externalId": "sub-task-4",
                            "description": "Sub Task-4-details",
                            "updatedAt": "2020-07-31T16:25:01.405Z",
                            "createdAt": "2020-07-31T16:01:11.286Z",
                            "__v": 0,
                            "parentId": "5f24404784504944928b10bc"
                        }
                    ],
                    "deleted": false,
                    "type": "multiple",
                    "projectTemplateId": "5f2402f570d11462f8e9a591",
                    "name": "Task-3",
                    "externalId": "Task-3",
                    "description": "Task-3details",
                    "updatedAt": "2020-07-31T16:25:01.430Z",
                    "createdAt": "2020-07-31T16:01:11.280Z"
                }
            ],
            "entityInformation": {
                "externalId": "1959076",
                "name": "Nigam Pratibha Vidyalaya (Girls), Jauna Pur, New Delhi"
            },
            "solutionInformation": {
                "externalId": "EF-DCPCR-2018-001",
                "name": "DCPCR Assessment Framework 2018",
                "description": "DCPCR Assessment Framework 2018",
                "_id": "5b98fa069f664f7e1ae7498c"
            },
            "entityTypeId": "5ce23d633c330302e720e65f",
            "programInformation": {
                "externalId": "PROGID01",
                "name": "DCPCR School Development Index 2018-19",
                "description": "DCPCR School Development Index 2018-19"
            },
            "title": "Improving Library",
            "goal": "Improving Library",
            "duration": "1 weeak"
        }
    }
    */

      /**
      * List of library projects
      * @method
      * @name projects
      * @returns {JSON} returns a list of library projects.
     */

    async projectDetails(req) {
        return new Promise(async (resolve, reject) => {
            try {
                
                const libraryProjectDetails = 
                await libraryCategoriesHelper.projectDetails(req.params._id);
                return resolve(libraryProjectDetails);

            } catch (error) {
                return reject(error);
            }
        })
    }

};
