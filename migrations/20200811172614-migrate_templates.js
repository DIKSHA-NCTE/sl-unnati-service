var uniqid = require('uniqid');
var moment = require('moment');
var totalTasks = 0;
module.exports = {
  async up(db) {
    global.migrationMsg = "Improvement Project Migration"
   
    let impTemplates = await db.collection('impTemplates').find({}).toArray();
    let templates = [];
    if (impTemplates) {
        for(i=0;i<impTemplates.length;i++){
          let templateCreation = await createNewTemplate(impTemplates[i]);
          templates.push(templateCreation);
        };

    }
    let temp = await db.collection('projectTemplateNew').insertMany(templates);

    
    async function createNewTemplate(doc) {
      try {
      let categories = doc.category;

      let taskIds = [];
      if(doc.tasks){
        totalTasks = totalTasks + doc.tasks.length;
       taskIds = await projectTemplateTasks(doc.tasks);
       
      }
      let categoryDocs;
      if (categories && categories.length > 0) {
        categoryDocs = await db.collection('projectCategories').find({ "name": { $in: categories } }, { externalId: 1 }).toArray();
      }


      let projectCategories = [];
      if (categoryDocs && categoryDocs.length > 0) {
        categoryDocs.map(category => {
          projectCategories.push({ _id: category._id, externalId: category.externalId })
        });
      }

      let template = {
        name: doc.title,
        externalId: uniqid(),
        categories: projectCategories, // old - category category of the project ex: teacher, school etc..
        duration: {
          value: "1W",
          label: "1 Week"
        }, // duration of the project like 3 months or 1year etc..
        difficultyLevel: {
          value: "B",
          label: "Basic"
        }, // difficulty level of project ex: BASIC,COMPLEX
        description: doc.goal, // old - goal Goal of the project
        concepts: doc.concepts,
        keywords: doc.keywords,
        status: "published", // draft, published
        isDeleted: false, // true, false 
        primaryAudience: doc.primaryAudience, // Do we require this ? or can we use recommended for ? ex : headmaster, teachers etc.
        rationale: doc.rationale, // Do we require this ?
        recommendedFor: [],
        risks: doc.risks, // Do we require this ?
        protocols: doc.protocols, // Do we require this ?
        tasks: taskIds,
        createdAt: moment().format('y-m-d:h:i:s'),
        updatedAt: moment().format('y-m-d:h:i:s'), // new field
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM", // new field
        vision: doc.vision, // Do we require this ? 
        problemDefinition: doc.problemDefinition, // Do we require this ? 
        prerequisites: doc.prerequisites, // Do we require this ? 
        assumptions: doc.assumptions, // Do we require this ? 
        resources: doc.resources,
        supportingDocuments: doc.supportingDocuments, // Do we require this ? 
        approaches: doc.approaches, // Do we require this ? 
        successIndicators: doc.successIndicators, // Do we require this ? 
        suggestedProject: doc.suggestedProject, // Do we require this ? 
        isReusable: true,
        entityType: [], // multiple,
        taskSequence: taskIds // array of task ids.
      }
      return template;

    } catch (error) {
       throw new Error(error);
    }


    }

    async function projectTemplateTasks(tasks) {
      return new Promise(async function (resolve, reject) {

        let taskIds = [];
          await Promise.all(tasks.map(async function(task){

          let children = [];
          if (task.subTasks && task.subTasks.length > 0) {
            await Promise.all(task.subTasks.map(async function (subtask) {

              let childrenId = await taskSchema(subtask, []);
              children.push(childrenId);

            }));
          }
          let tasksId = await taskSchema(task, children);

          if (children && children.length > 0) {
            let projectTasks = await db.collection('projectTemplateTasks').updateMany({ _id: { $in: children } }, { $set: { parentId: tasksId } });
          }
          taskIds.push(tasksId);
        }))
        resolve(taskIds);
     })

    }
    let taskIds = [];
    async function taskSchema(task, children) {
      let projectTask = {
        "name": task.title, //  Old - title , title of the task
        "createdAt": moment().format('y-m-d:h:i:s'),
        "updatedAt": moment().format('y-m-d:h:i:s'),
        "createdBy": "SYSTEM",
        "updatedBy": "SYSTEM", // new field
        "isDeleted": false
      }
      if(children && children.length > 0){
        projectTask["children"] = children;
      }
      let projectTemplateTasks = await db.collection('projectTemplateTasks').insertOne(projectTask);
      return projectTemplateTasks.insertedId;
    }

  },

  async down(db) {
  }
};
