import { getStore } from "./store"

export interface Device {
    id: string
    useragent: string
}

const store = getStore()

export async function SaveOrUpdateDevice(userid: string, device: Device) {

    const key = `devices:${userid}`
    const devices = await store.get(key, null) as Device[] ??[];
    const exist = devices.find(s => s.id == device.id);
    if (exist == undefined) {
        devices.push(device)
        await store.put(key, devices, null);
    }
    return {devices, isNew: !exist};
}

export async function GetAllDevices(userid: string) {

    const key = `devices:${userid}`;
    const devices = await store.get(key, null) as Device[] ??[];
    return devices;
}