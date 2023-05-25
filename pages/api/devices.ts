import { getServerSession } from "next-auth";
import { GetAllDevices } from "../../libs/deviceStore"
import { authOptions } from "./auth/[...nextauth]";
import { getUserId } from "../../libs/webauthn";
import { NextApiRequest, NextApiResponse } from "next";



export default async function Devices(req: NextApiRequest, res: NextApiResponse) {

    try {
        const crypto = await import('node:crypto');
        globalThis.crypto = crypto.webcrypto;
    } catch (err) {
        console.error('crypto support is disabled!');
    }

    const session = await getServerSession(req, res, authOptions);

    let login = session?.user?.email ?? "";

    const userid = await getUserId(login)

    const devices = await GetAllDevices(userid);
    res.status(200).json(devices)
}
