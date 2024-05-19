
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const app = express();
const querystring = require('node:querystring');

app.use(express.json());

const port = process.env.PORT || 8080;

const client = new Client({

    user: 'postgres',
    password: 'trengarpg',
    host: 'host.docker.internal',
    port: '5432',
    database: 'trengar'
});

const postgresConnection = async () => {
    try {
        await client.connect();

    } catch(err) {
        console.log(err);
    }
};

postgresConnection().then(() => {console.log("connection success!")}).catch((err)=> {
    console.log(`Error connecting to postgres database! ${err}`);
});

app.listen(port, () => {
    console.log(`Trengar is now ready to help! Talk to it on port ${port}`);
});

app.get("/user", async (req, res) => {

    //TODO: create working SQL Injection prevention
    let query = `SELECT * FROM users WHERE id = ${req.query.id}`;
    try {
        client.query(query, (err, result) => {
            if(err) {
                throw err;
            }
            res.status(200).json(result.rows);
        })
    } catch(err) {
        throw err;
    }
});

app.get("/getToolByName", async(req, res)=> {

    let toolName = req.query.name;
    let query = `SELECT tool_name, tool_creator, tool_type, tool_description, tags, price, tool_operating_systems, ease_of_use, type, tool_type, tool_icon_link FROM tool WHERE LOWER(tool_name) LIKE LOWER('%${toolName}%') LIMIT 1`;
    try{
        client.query(query, (err, result) => {
            if(err) {
                throw 0;
            }
            res.status(200).json(result.rows);
        });
    }catch(err) {
        throw err;
    }
});



app.get("/getToolByTags", async(req, res)=> {

    let toolTags = req.body.tags;
    let toolType = req.body.type;
    let toolSystems = null;
    let tagsLength = null;

    try {
        toolSystems = req.body.systemTypes;
    }catch(err) {
        console.log("no systems");
    }
    
    let query = `SELECT tool_name, tool_creator, tool_type, tool_description, tags, price, tool_operating_systems, ease_of_use, type, tool_type, tool_icon_link FROM tool WHERE LOWER(tool.tool_type) = LOWER('${toolType}') `;

    //ADD TAGS TO QUERY
    if(toolTags != null) {
        tagsLength = Array.from(toolTags).length;
        toolTags.map((item, i) => {
            query += `AND '${item}' = ANY(tags)`;
        });
    }

    //TODO: ADD OPERATING SYSTEMS TO QUERY
    if(toolSystems != null) {
        query += " AND "
        toolSystems.map((item, index) => {
            query += `LOWER('${item}') = ANY(tool_operating_systems)`;
            if(index < Array.from(toolSystems).length-1) {
                query += " OR ";
            }
        });

    

    }

    query += `;`;

    try{
        client.query(query, (err, result) => {
            if(err) {
                throw 0;
            }
            if(result.rowCount == 0) {
                res.status(404).json("We're terribly sorry, but no software that fits your requirements was found");
            }

            res.status(200).json(result.rows);
        });
    }catch(err) {
        throw(err);
    }
});


app.post("/createUser", async (req, res) => {

    

    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let date = new Date();
    let created = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2) }-${date.getDate()}`;
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let salt = "";

    //TODO: rework checking to utilise promises so it actually works 
    // let check_login_query = `SELECT COUNT(uuid) FROM users WHERE login = '${username}';`;
    // let check_email_query = `SELECT COUNT(uuid) FROM users WHERE email = '${email}';`;
    // let login_exists = 0;
    // let email_exists = 0;

    // try {
    // client.query(check_login_query, (err, result) => {
    //     if(err) {
    //         throw err;
    //     }
        
    //     login_exists = result.rows.at(0)['count'];
    // })
    // }catch(err) {
    //     throw "error on query" + err;
    // }

    // try {
    //     client.query(check_email_query, (err, result) => {
    //         if(err) {
    //             throw err;
    //         }
            
    //         email_exists = result.rows.at(0)['count'];
    //     })
    // }catch(err) {
    //     throw "error on query" + err;
    // }

    for(let i = 0; i < 6; i++) {
        salt += characters.at(Math.round((Math.random() * (Math.floor(characters.length-1)))));
    }



    password += salt;


    let hash = require('crypto').createHash('sha256').update(password, 'utf-8').digest('base64');

    let query = `INSERT INTO users (login, password, email, passwordsalt, datecreated, status) VALUES ('${username}', '${hash}', '${email}', '${salt}', '${created}', 'false');`;

    try {
        client.query(query, (err, result)=> {
            if(err) {
                throw err;
            }
            res.status(200).json("successfully added user");
        });
    }catch(err) {
        throw err;
    }
    
    
});

//query example

// client.query("SELECT * FROM users WHERE id = 1", (err, result) => {
//     if(!err) {
//         res.send(`returned result: ${result.rows}`)
//         console.log("Query successful:\n", result.rows);
//     } else {
//         res.send(`Error on query! ${err.message}`);
//         console.log('Error on query', err);
//     }
// });
