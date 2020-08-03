module.exports = {
  async up(db) {
    global.migrationMsg = "Create projects form.";

    let forms = [
      {
        field: "name",
        label: "Name",
        value: "",
        visible: true,
        editable: true,
        input: "text",
        validation: {
          required: true
        }
      },{
        field: "description",
        label: "Description",
        value: "",
        visible: true,
        editable: true,
        input: "textarea",
        validation: {
          required: true
        }
      },{
        field: "categories",
        label: "Categories",
        value: "",
        visible: true,
        editable: true,
        input: "select",
        options: [],
        validation: {
          required: false
        }
      },{
        field: "startDate",
        label: "Start Date",
        value: "",
        visible: true,
        editable: true,
        input: "date",
        validation: {
          required: true
        }
      },{
        field: "endDate",
        label: "End Date",
        value: "",
        visible: true,
        editable: true,
        input: "date",
        validation: {
          required: true
        }
      }   
    ];
    
    await db.collection('forms').insertOne({
      name: "projects",
      value: forms
    });

  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
