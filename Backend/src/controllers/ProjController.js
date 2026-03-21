import prisma from "../config/prisma.js";

export const projData = async (req,res) => {
    const { id } = req.user;
    const orgid = req.params.id;
    const { role } = req.body;
    // console.log(orgid);
    // console.log(role);
    
    try {
        let data = [];
        // console.log(typeof(role));
        if(role==="admin"){
            data = await prisma.project.findMany({
                where : {
                    org_id : Number(orgid)
                }
            });
            console.log("inside");
        }else {
            data = await prisma.org_member.findMany({
                where : {
                    org_id_member_id : {
                        org_id : orgid,
                        member_id : id
                    }
                },
                include : {
                    project : true
                }
            });
        }
        res.status(200).json(data);
    }catch (error){
        console.log(error.message);
        res.status(404).json({message : error.message});
    }
};