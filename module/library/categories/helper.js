/**
 * name : helper.js
 * author : Aman
 * created-date : 16-July-2020
 * Description : Project categories helper functionality.
 */

// Dependencies 
const kendraService = require(GENERICS_FILES_PATH + "/services/kendra");
const sessionHelpers = require(GENERIC_HELPERS_PATH+"/sessions");

/**
    * LibraryCategoriesHelper
    * @class
*/

module.exports = class LibraryCategoriesHelper {

      /**
   * Library project categories documents.
   * @method
   * @name categoryDocuments
   * @param {Object} [findQuery = "all"] - filtered data.
   * @param {Array} [fields = "all"] - projected data.
   * @param {Array} [skipFields = "none"] - fields to skip.
   * @returns {Array} - Library project categories data.
   */

  static categoryDocuments(
    findQuery = "all", 
    fields = "all",
    skipFields = "none"
  ) {
      return new Promise(async (resolve, reject) => {
        
        try {
          
          let queryObject = {};

          if (findQuery != "all") {
              queryObject = findQuery;
          }

          let projection = {};

          if (fields != "all") {
              fields.forEach(element => {
                  projection[element] = 1;
              });
          }

          if (skipFields != "none") {
              skipFields.forEach(element => {
                  projection[element] = 0;
              });
          }

          let projectCategoriesData = 
          await database.models.projectCategories.find(
            queryObject, 
            projection
          ).lean();
          
          return resolve(projectCategoriesData);

      } catch (error) {
          return reject(error);
        }
      });
    }

    /**
      * List of library project categories.
      * @method
      * @name list
      * @returns {Object} Project categories.
     */

    static list() {
        return new Promise(async (resolve, reject) => {
            try {

                let result = "";
                let projectCategoryData = sessionHelpers.get("libraryCategories");

                if( projectCategoryData && projectCategoryData.length > 0 ) {
                    result = projectCategoryData;
                } else {
                    result = await this.set();
                }

                return resolve({
                  message : CONSTANTS.apiResponses.PROJECT_CATEGORIES_FETCHED,
                  result : result
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * Set library project categories.
      * @method
      * @name set
      * @returns {Object} Set project categories.
     */

    static set() {
        return new Promise(async (resolve, reject) => {
            try {

                let projectCategoriesData = 
                await this.categoryDocuments(
                    {
                        status : CONSTANTS.common.ACTIVE_STATUS
                    },
                    [
                        "externalId",
                        "name",
                        "icon",
                        "updatedAt"
                    ]
                );
                
                if( !projectCategoriesData.length > 0 ) {
                    throw {
                        status : HTTP_STATUS_CODE.bad_request.status,
                        message : CONSTANTS.apiResponses.LIBRARY_CATEGORIES_NOT_FOUND,
                        result : []
                    }
                }
    
                let categories = {};
                let icons = [];
                
                projectCategoriesData.map(category => {
                    
                    categories[category.icon] = {
                        name : category.name,
                        type : category.externalId,
                        updatedAt : category.updatedAt
                    };

                    if( category.icon !== "" ) {
                        icons.push(category.icon);
                    }

                });

                let projectCategories = "";

                if( icons.length > 0 ) {
                    
                    projectCategories = 
                    await kendraService.getDownloadableUrl(
                        {
                            filePaths : icons
                        }
                    );
                    
                    if( projectCategories.status !== HTTP_STATUS_CODE.ok.status) {
                        throw {
                            status : HTTP_STATUS_CODE.bad_request.status,
                            message : CONSTANTS.apiResponses.URL_COULD_NOT_BE_FOUND,
                            result : []
                        }
                    }

                    projectCategories = 
                    projectCategories.result.map(downloadableImage=>{
                        return _.merge(
                            categories[downloadableImage.filePath],
                            { url : downloadableImage.url }
                        )
                    });
                } else {
                    projectCategories = Object.values(categories);
                }

                projectCategories = projectCategories.sort((a,b)=> a.name.toString() > b.name.toString() ? 1 : -1);

                sessionHelpers.set("libraryCategories",projectCategories);

                return resolve(projectCategories);

            } catch (error) {
                return reject(error);
            }
        })
    }

      /**
      * List of library projects.
      * @method
      * @name projects
      * @param categoryId - category external id.
      * @param pageSize - Size of page.
      * @param pageNo - Recent page no.
      * @param search - search text.
      * @param sortedData - Data to be sorted.
      * @returns {Object} List of library projects.
     */

    static projects( categoryId,pageSize,pageNo,search,sortedData ) {
        return new Promise(async (resolve, reject) => {
            try {

                let matchQuery = {
                    $match : {
                        "categories.externalId" : categoryId,
                        "isReusable" : true
                    }
                };

                if ( search !== "" ) {
                    matchQuery["$match"]["$or"] = [
                        { "name": new RegExp(search, 'i') },
                        { "descripion": new RegExp(search, 'i') },
                        { "categories": new RegExp(search, 'i') }
                    ]
                }

                let aggregateData = [];
                aggregateData.push(matchQuery);

                let sortedQuery = {
                    "$sort" : {
                        createdAt : -1
                    }  
                }
                
                if( sortedData && sortedData === CONSTANTS.common.IMPORTANT_PROJECT ) {
                    sortedQuery["$sort"] = {};
                    sortedQuery["$sort"]["noOfRatings"] = -1;
                }
                
                aggregateData.push(sortedQuery);

                aggregateData.push({
                    $project : {
                        "name" : 1,
                        "externalId" : 1,
                        "noOfRatings" : 1,
                        "averageRating" : 1,
                        "createdAt" : 1,
                        "description" : 1
                    }
                },{
                    $facet : {
                        "totalCount" : [
                            { "$count" : "count" }
                        ],
                        "data" : [
                            { $skip : pageSize * ( pageNo - 1 ) },
                            { $limit : pageSize }
                        ],
                    }
                },{
                    $project : {
                        "data" : 1,
                        "count" : {
                            $arrayElemAt : ["$totalCount.count", 0]
                        }
                    }
                });

                let result = await database.models.projectTemplates.aggregate(aggregateData);

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECTS_FETCHED,
                    result : {
                        data : result[0].data,
                        count : result[0].count ? result[0].count : 0
                    }
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    /**
      * Details of library projects.
      * @method
      * @name projectDetails
      * @param projectId - project internal id.
      * @returns {Object} Details of library projects.
     */

    static projectDetails(projectId) {
        return new Promise(async (resolve, reject) => {
            try {

                let projectsData = 
                await database.models.projectTemplates.find(
                    {
                        "_id" : projectId
                    }
                ).lean();
                
                if( !projectsData.length > 0 ) {
                    throw {
                        message : CONSTANTS.apiResponses.PROJECT_NOT_FOUND,
                        result : []
                    }
                }

                if( projectsData[0].tasks && projectsData[0].tasks.length > 0 ) {

                    projectsData[0].tasks = 
                    await database.models.projectTemplateTasks.find({
                        _id : {
                            $in : projectsData[0].tasks
                        }
                    });
                }

                return resolve({
                    message : CONSTANTS.apiResponses.PROJECTS_FETCHED,
                    result : projectsData[0]
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

};
