/**
 * name : helper.js
 * author : Aman
 * created-date : 16-July-2020
 * Description : Projects helper functionality.
 */

 // Dependencies

 const kendraService = require(GENERICS_FILES_PATH + "/services/kendra");
 const libraryCategoriesHelper = require(MODULES_BASE_PATH + "/library/categories/helper");
 const projectTemplatesHelper = require(MODULES_BASE_PATH + "/project/templates/helper");
 const projectTemplateTasksHelper = require(MODULES_BASE_PATH + "/project/templateTasks/helper");
 const {v4: uuidv4 } = require('uuid');

/**
    * UserProjectsHelper
    * @class
*/

module.exports = class UserProjectsHelper {

    /**
     * Lists of projects.
     * @method
     * @name projectDocument
     * @param {Array} [filterData = "all"] - project filter query.
     * @param {Array} [fieldsArray = "all"] - projected fields.
     * @param {Array} [skipFields = "none"] - field not to include
     * @returns {Array} Lists of projects. 
     */
    
    static projectDocument(
        filterData = "all", 
        fieldsArray = "all",
        skipFields = "none"
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let queryObject = (filterData != "all") ? filterData : {};
                let projection = {}
           
                if (fieldsArray != "all") {
                    fieldsArray.forEach(field => {
                        projection[field] = 1;
                   });
               }
               
               if( skipFields !== "none" ) {
                   skipFields.forEach(field=>{
                       projection[field] = 0;
                   });
               }
               
               let templates = 
               await database.models.projects.find(
                   queryObject, 
                   projection
               ).lean();
           
               return resolve(templates);
           
           } catch (error) {
               return reject(error);
           }
       });
   }

    /**
      * List of projects.
      * @method
      * @name list
      * @param userId - logged in user id.
      * @returns {Object} Projects.
     */

    static list(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let projects = 
                await this.projectDocument(
                    {
                        userId : userId
                    },"all",[
                        "taskReport",
                        "createdFor",
                        "solutionId",
                        "solutionExternalId",
                        "programId",
                        "programExternalId",
                        "projectTemplateId",
                        "projectTemplateExternalId"
                    ]
                );

                if( !projects.length > 0 ) {
                    throw {
                        message : CONSTANTS.apiResponses.PROJECT_NOT_FOUND
                    }
                }

                for( let project = 0 ; project < projects.length ; project ++) {
                    let currentProject = projects[project];
                    currentProject.entityInformation = 
                    _.pick(
                        currentProject.entityInformation,
                        ["externalId","name"]
                    );

                    currentProject.solutionInformation = 
                    _.pick(
                        currentProject.solutionInformation,
                        ["externalId","name","description","_id"]
                    );

                    currentProject.programInformation = _.pick(
                        currentProject.programInformation,
                        ["externalId","name","description","_id"]
                    );

                    delete currentProject.metaInformation;
                }

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECTS_FETCHED,
                    result : projects
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

      /**
      * List of projects meta form.
      * @method
      * @name metaForm
      * @returns {Object} List of projects meta form.
     */

    static metaForm( userToken ) {
        return new Promise(async (resolve, reject) => {
            try {
                
                let forms = 
                await kendraService.formsDocuments(
                    {
                        name : "projects"
                    },[
                        "value"
                    ]
                );

                if( !forms.result.length > 0 ) {

                    return resolve({
                        message : CONSTANTS.apiResponses.PROJECTS_FORM_NOT_FOUND,
                        result : []
                    })

                }

                let categoriesData = 
                await database.models.projectCategories.find({},
                    {
                        name : 1,
                        externalId : 1
                    }
                ).lean();

                categoriesData = categoriesData.map(category=>{
                    return {
                        label : category.name,
                        value : category.externalId 
                    };
                });

                categoriesData.push({
                    label : CONSTANTS.common.OTHERS,
                    value : CONSTANTS.common.OTHERS.toLowerCase()
                });

                let formsData = forms.result[0].value;

                formsData[formsData.length - 1].options = categoriesData;

                const userPrivatePrograms = 
                await kendraService.userPrivatePrograms(userToken);

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECTS_METAFORM_FETCHED,
                    result : {
                        form : formsData,
                        programs : userPrivatePrograms.result && userPrivatePrograms.result.length > 0 ?
                        userPrivatePrograms.result : []
                    }
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * List of projects tasks meta form.
      * @method
      * @name tasksMetaForm
      * @returns {Object} List of projects tasks meta form.
     */

    static tasksMetaForm() {
        return new Promise(async (resolve, reject) => {
            try {
                
                let forms = 
                await kendraService.formsDocuments(
                    {
                        name : "projectTasks"
                    },[
                        "value"
                    ]
                );

                if( !forms.result.length > 0 ) {

                    return resolve({
                        message : CONSTANTS.apiResponses.PROJECT_TASKS_FORM_NOT_FOUND,
                        result : []
                    })

                }

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECT_TASKS_METAFORM_FETCHED,
                    result : {
                        form : forms.result[0].value
                    }
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * Sync project.
      * @method
      * @name sync 
      * @param {Object} data - body data.
      * @param {String} userId - Logged in user id.
      * @param {String} userToken - User token.
      * @returns {Object} Project created information.
     */

    static sync( data,userId,userToken,projectId = "" ) {
        return new Promise(async (resolve, reject) => {
            try {

                let projectData = 
                await this.createOrUpdateProject(
                    data,
                    userId,
                    userToken,
                    projectId ? projectId : ""
                );

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECTS_FETCHED,
                    result : projectData
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * Project creation or updation.
      * @method
      * @name createOrUpdateProject 
      * @param {Object} data - body data.
      * @param {String} userId - Logged in user id.
      * @param {String} userToken - User token.
      * @param {String} projectId - Project id.
      * @returns {Object} Project created or updated information.
     */

    static createOrUpdateProject(data,userId,userToken,projectId) {
        return new Promise(async (resolve, reject) => {
            try {

                const projectsModel = Object.keys(schemas["projects"].schema);

                let createOrUpdateObject = {};

                if( data.categories ) {
                    createOrUpdateObject.categories = 
                    await _projectCategories(data.categories);
                }

                if( data.startDate ) {
                    createOrUpdateObject["startDate"] = data.startDate;
                }

                if( data.endDate ) {
                    createOrUpdateObject["endDate"] = data.endDate;
                }

                if( data.entities && data.entities.length > 0 ) {

                    let entitiesData = await _entitiesInformation(data.entities);
                    createOrUpdateObject.entityInformation = entitiesData[0];
                }

                if( 
                    ( data.programId && data.programId !== "" )  ||
                    ( data.programName && data.programName !== "" ) 
                ) {
                    
                    let programAndSolutionData = {
                        programName : data.programName ?  data.programName : "",
                        programId : data.programId ? data.programId : "",
                        entities : 
                        createOrUpdateObject.entityInformation ? 
                        [ObjectId(createOrUpdateObject.entityInformation._id)] : []
                    };

                    let solutionAndProgramCreation = 
                    await kendraService.createUserProgramAndSolution(
                        userId,
                        programAndSolutionData,
                        userToken
                    );

                    createOrUpdateObject.solutionInformation =  _.omit(
                        solutionAndProgramCreation.result.solution,
                        ["__v"]
                    );
    
                    createOrUpdateObject.solutionInformation._id = 
                    ObjectId(createOrUpdateObject.solutionInformation._id);
    
                    createOrUpdateObject.programInformation =  _.omit(
                        solutionAndProgramCreation.result.program,
                        ["__v"]
                    );
    
                    createOrUpdateObject.programInformation._id = 
                    ObjectId(createOrUpdateObject.programInformation._id);

                    createOrUpdateObject.createdFor = createOrUpdateObject.programInformation.createdFor;
                    createOrUpdateObject.rootOrganisations = createOrUpdateObject.programInformation.rootOrganisations;
                }

                let booleanData = this.booleanData(schemas["projects"].schema);
                let mongooseIdData = this.mongooseIdData(schemas["projects"].schema);

                if( data.tasks ) {
                    createOrUpdateObject.tasks = await _projectTask(
                        data.tasks,
                        userId
                    );
                }

                Object.keys(data).forEach(updateData => {
                    if ( 
                        !createOrUpdateObject[updateData] && 
                        projectsModel.includes(updateData) 
                    ) {
                        if ( booleanData.includes(updateData) ) {
                
                            createOrUpdateObject[updateData] = 
                            UTILS.convertStringToBoolean(data[updateData]);
            
                        } else if( mongooseIdData.includes(updateData) ) {
                            createOrUpdateObject[updateData] = ObjectId(data[updateData]);
                        } else {
                            createOrUpdateObject[updateData] = data[updateData];
                        } 
                    }
                });

                let projectCreation = "";
                createOrUpdateObject.updatedBy = userId;

                if( projectId !== "" ) {

                    const projects = await this.projectDocument(
                        {
                            _id : projectId
                        },["tasks"]
                    );

                    createOrUpdateObject.tasks.forEach(task => {
                        task.updatedBy = userId;
                        task.updatedAt = new Date();
                        
                        let taskIndex = 
                        projects[0].tasks.findIndex(projectTask=>projectTask._id === task._id );
                        
                        if( taskIndex < 0 ) {
                            projects[0].tasks.push(
                                taskUpdated
                            );
                        } else {
                            projects[0].tasks[taskIndex] = taskUpdated;
                        }
                    });

                    createOrUpdateObject.tasks = projects[0].tasks;

                    projectCreation = await database.models.projects.findOneAndUpdate({
                        _id : projectId
                    },{
                        $set : createOrUpdateObject
                    },{
                        new : true
                    });

                } else {

                    createOrUpdateObject.createdBy = userId;
                    createOrUpdateObject.userId = userId;

                    projectCreation = await database.models.projects.create(
                        createOrUpdateObject
                    );

                    if ( data.projectTemplateId ) {
                    
                        await projectTemplatesHelper.ratings(
                            data.projectTemplateId,
                            data.rating,
                            userToken
                        );
                    }

                }

                projectCreation = _projectInformation(projectCreation._doc);

                projectCreation.payload = data.payload;

                return resolve(projectCreation);

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * Bulk create user projects.
      * @method
      * @name bulkCreate - Bulk create user projects.
      * @param {Array} csvData - csv data.
      * @param {String} userId - logged in user id.
      * @param {String} userToken - logged in user token.
      * @returns {Object}  Bulk create user projects.
     */

    static bulkCreate( csvData,userId,userToken ) {
        return new Promise(async (resolve, reject) => {
            try {

                const fileName = `bulk-create-user-`;
                let fileStream = new CSV_FILE_STREAM(fileName);
                let input = fileStream.initStream();
      
                (async function () {
                    await fileStream.getProcessorPromise();
                    return resolve({
                        isResponseAStream: true,
                        fileNameWithPath: fileStream.fileNameWithPath()
                    });
                })();

                let templateIds = [];
                let entityIds = [];

                csvData.forEach(data => {
                    
                    templateIds.push(data.templateId);
                    entityIds.push(data.entityId);

                });

                let entityDocument = {};

                if (entityIds.length > 0) {
                    const entitiesData = await _entitiesInformation(entityIds);
                    entityDocument = 
                    entitiesData.reduce((ac, entity) => ({ ...ac, [entity._id.toString()]: entity}), {});
                }

                let templateData = {};
                let solutionIds = [];
                let programIds = [];

                if( templateIds.length > 0 ) {
                    
                    const projectTemplates = 
                    await projectTemplatesHelper.templateDocument({
                        externalId : {
                            $in : templateIds
                        },
                        isReusable : false
                    },"all",
                    [
                        "ratings",
                        "noOfRatings",
                        "averageRating"
                    ]);

                    if( projectTemplates.length > 0 ) {
                        
                        projectTemplates.forEach(template => {
                            
                            templateData[template.externalId] = template;
                            
                            if( template.solutionId ) {
                                solutionIds.push(template.solutionId);
                            }

                            if( template.programId ) {
                                programIds.push(template.programId);
                            }

                        })
                    }
                }

                let solutions = {};

                if( solutionIds.length > 0 ) {

                    let solutionData = 
                    await kendraService.solutionDocuments({
                        _id : {
                            $in : solutionIds
                        }
                    },"all",[
                        "levelToScoreMapping",
                        "scoringSystem",
                        "themes",
                        "flattenedThemes",
                        "questionSequenceByEcm",
                        "entityProfileFieldsPerEntityTypes",
                        "evidenceMethods",
                        "sections",
                        "noOfRatingLevels",
                        "roles",
                        "captureGpsLocationAtQuestionLevel",
                        "enableQuestionReadOut"
                    ]);

                    if( solutionData.result && solutionData.result.length > 0 ) {
                        
                        solutionData.result.forEach(solution => {
                            solutions[solution.externalId] = solution;
                        })
                    }

                }

                let programs = {};

                if( programIds.length > 0 ) {

                    let programData = 
                    await kendraService.programsDocuments({
                        _id : {
                            $in : programIds
                        }
                    },"all",["components"]);

                    if( programData.result && programData.result.length > 0 ) {
                        
                        programData.result.forEach(program => {
                            programs[program.externalId] = program;
                        })
                    }
                }

                for ( 
                    let pointerToCsvData = 0; 
                    pointerToCsvData < csvData.length ; 
                    pointerToCsvData ++ 
                ) {

                    let currentCsvData = csvData[pointerToCsvData];

                    if( !templateData[currentCsvData.templateId] ) {
                        currentCsvData["STATUS"] = 
                        CONSTANTS.apiResponses.PROJECT_TEMPLATE_NOT_FOUND;
                        continue;
                    }

                    let currentTemplateData = 
                    templateData[csvData[pointerToCsvData].templateId];

                    currentTemplateData.userId = csvData[pointerToCsvData]["keycloak-userId"];
                    currentTemplateData.createdBy = userId;
                    currentTemplateData.updatedBy = userId;

                    if( 
                        currentTemplateData && 
                        currentTemplateData.tasks && 
                        currentTemplateData.tasks.length > 0 
                    ) {
                        
                        const tasksAndSubTasks = 
                        await projectTemplateTasksHelper.tasksAndSubTasks(
                            currentTemplateData._id
                        );

                        currentTemplateData.tasks = _projectTask(tasksAndSubTasks);
                    }

                    let solutionInformation = {};

                    if ( currentTemplateData.solutionExternalId ) {

                        if( !solutions[currentTemplateData.solutionExternalId] ) {
                            currentCsvData["STATUS"] = 
                            CONSTANTS.apiResponses.SOLUTION_NOT_FOUND;
                            continue;
                        }

                        solutionInformation = solutions[currentTemplateData.solutionExternalId];
                        currentTemplateData.solutionInformation = 
                        _.omit(
                            solutionInformation,
                            ["entities","programId","programExternalId"]
                        );

                        currentTemplateData.createdFor = solutionInformation.createdFor;
                        currentTemplateData.rootOrganisations = solutionInformation.rootOrganisations;

                        delete currentTemplateData.solutionId;
                        delete currentTemplateData.solutionExternalId;
                    }

                    if( currentTemplateData.programExternalId ) {

                        if( !programs[currentTemplateData.programExternalId] ) {
                            currentCsvData["STATUS"] = 
                            CONSTANTS.apiResponses.PROGRAM_NOT_FOUND;
                            continue;
                        }

                        currentTemplateData.programInformation = 
                        programs[currentTemplateData.programExternalId];

                        delete currentTemplateData.programId;
                        delete currentTemplateData.programExternalId;
                    }

                    if( entityDocument[csvData[pointerToCsvData].entityId] ) {
                        
                        let entities = [];

                        if( 
                            solutionInformation.entities && 
                            solutionInformation.entities.length > 0 
                        ) {
                            let entityIndex = 
                            solutionInformation.entities.findIndex(entity => entity._id === csvData[pointerToCsvData].entityId);

                            if( entityIndex < 0 ) {
                                entities = 
                                solutionInformation.entities.push(ObjectId(csvData[pointerToCsvData].entityId))
                            }
                        } else {
                            entities = [ObjectId(csvData[pointerToCsvData].entityId)];
                        }

                        if( entities.length > 0 ) {
                            await kendraService.updateSolution(
                                userToken,
                                {
                                    entities : entities
                                },
                                solutionInformation.externalId
                            )
                        }

                        currentTemplateData.entityInformation = 
                        entityDocument[csvData[pointerToCsvData].entityId];

                        delete currentTemplateData.entityType;
                        delete currentTemplateData.entityTypeId;
                    }

                    const projectCreation = 
                    await database.models.projects.create(currentTemplateData);

                    currentCsvData["STATUS"] = projectCreation._id;

                    input.push(currentCsvData);
                }

                input.push(null);

            } catch (error) {
                return reject(error);
            }
        })
    }

     /**
   * Projects boolean data.
   * @method
   * @name booleanData     
   * @returns {Array} Boolean data.
   */

  static booleanData() {

    const projectsSchema = schemas["projects"].schema;
    
    const projectSchemaKey = Object.keys(projectsSchema);

    let booleanProjects = []; 
    
    projectSchemaKey.forEach(projectSchema => {

      const currentSchema = projectsSchema[projectSchema];

      if( 
          currentSchema.hasOwnProperty('default') && 
          typeof currentSchema.default === "boolean" 
      ) {
          booleanProjects.push(projectSchema);
        }
    });

    return booleanProjects;
  }

       /**
   * Projects object id field.
   * @method
   * @name mongooseIdData     
   * @returns {Array} Projects object id field.
   */

  static mongooseIdData() {

    const projectsSchema = schemas["projects"].schema;
    
    const projectSchemaKey = Object.keys(projectsSchema);

    let mongooseIds = []; 
    
    projectSchemaKey.forEach(projectSchema=>{

      const currentSchemaType = projectsSchema[projectSchema];

      if( currentSchemaType === "ObjectId" ) {
          mongooseIds.push(projectSchema);
        }
    });

    return mongooseIds;
  }

};

 /**
  * Project information.
  * @method
  * @name _projectInformation 
  * @param {Object} project - Project data.
  * @returns {Object} Project information.
*/

function _projectInformation(project) {
    
    project.entityInformation = _.pick(
        project.entityInformation,
        ["externalId","name","entityType","entityTpeId"]
    );

    project.solutionInformation = _.pick(
        project.solutionInformation,
        ["externalId","name"]
    );

    project.programInformation = _.pick(
        project.programInformation,
        ["externalId","name"]
    );

    Object.keys(project.metaInformation).forEach(projectMetaKey=>{
        project[projectMetaKey] = project.metaInformation[projectMetaKey];
    })

    delete project.metaInformation;

    return project;
}

/**
  * Task of project.
  * @method
  * @name _projectTask
  * @param {Array} task - task data.
  * @param {String} userId - logged in user id.
  * @returns {Object} Project task.
*/

function _projectTask(task,userId) {

    task.forEach(singleTask => {

        singleTask.externalId = singleTask.externalId ? singleTask.externalId : singleTask.name.toLowerCase();
        singleTask.type = singleTask.type ? singleTask.type : CONSTANTS.common.SINGLE_TASK_TYPE;
        singleTask.status = singleTask.status ? singleTask.status : CONSTANTS.common.NOT_STARTED;
        singleTask.isDeleted = singleTask.isDeleted ? singleTask.isDeleted : false;
        singleTask.isDeleteable = singleTask.isDeleteable ? singleTask.isDeleteable : false;
        singleTask.createdBy = singleTask.createdBy ? singleTask.createdBy : userId;
        singleTask.updatedBy = singleTask.updatedBy ? singleTask.updatedBy : userId;
        singleTask.createdAt = singleTask.createdAt ? singleTask.createdAt : new Date();
        singleTask.updatedAt = singleTask.updatedAt ? singleTask.updatedAt : new Date();
        singleTask._id = UTILS.isValidMongoId(singleTask._id.toString()) ? uuidv4() : singleTask._id;

        if( singleTask.startDate ) {
            singleTask.startDate = singleTask.startDate; 
        }

        if( singleTask.endDate ) {
            singleTask.endDate = singleTask.endDate; 
        }

        if( singleTask.children ) {
            _projectTask(singleTask.children);
        } else {
            singleTask.children = [];
        }

    })

    return task;
}

/**
  * Project categories information.
  * @method
  * @name _projectCategories 
  * @param {Array} categories - Categories data.
  * @returns {Object} Project categories information.
*/

function _projectCategories(categories) {
    return new Promise( async (resolve,reject)=>{
        try {

            const categoryData = 
            await libraryCategoriesHelper.categoryDocuments({
                externalId : { $in : categories }
            },["name","externalId"]);

            let categoriesExternalIdMap = {};

            if ( categoryData.length > 0 ) {
                
                categoryData.forEach(category=>{
                    categoriesExternalIdMap[category.externalId] = category;
                });
            }

            const categoriesData = categories.map(categoryExternalId => { 
                let categoryData = {};

                if( categoriesExternalIdMap[categoryExternalId] ) {
                    categoryData = categoriesExternalIdMap[categoryExternalId];
                } else {
                    categoryData = {
                        name : UTILS.camelCaseToTitleCase(categoryExternalId),
                        externalId : categoryExternalId,
                        _id : ""
                    }
                }

                return categoryData;
            });

            return resolve(categoriesData);

        } catch(error) {
            return reject(error);
        }
    })
}

/**
  * Entities information for project.
  * @method
  * @name _entitiesInformation 
  * @param {String} entityIds - entity id.
  * @returns {Object} Project entity information.
*/

function _entitiesInformation(entityIds) {
    return new Promise( async (resolve,reject)=>{
        try {

            let entityData = 
            await kendraService.entityDocuments(
                {
                    _id : {
                        $in : entityIds
                    }
                },
                ["metaInformation","entityType","entityTypeId"]
            );

            let entitiesData = [];

            if( entityData.result && entityData.result.length > 0 ) {

                entitiesData = entityData.result.map(entity => {
                    entity.metaInformation._id = ObjectId(entity._id);
                    entity.metaInformation.entityType = entity.entityType;
                    entity.metaInformation.entityTypeId = ObjectId(entity.entityTypeId);
                    return entity.metaInformation;
                });
            }

            return resolve(entitiesData);

        } catch(error) {
            return reject(error);
        }
    })
}



