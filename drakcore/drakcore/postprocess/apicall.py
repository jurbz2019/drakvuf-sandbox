import json
from io import BytesIO
from collections import defaultdict
from drakcore.postprocess import postprocess
from karton2 import Task, Resource
from typing import Dict


def process_logfile(log):
    result = []

    for line in log.readlines():
        entry = json.loads(line)
        r = {
            "pid": entry["PID"],
            "timestamp": entry["TimeStamp"],
            "method": entry["Method"],
            "arguments": entry["Arguments"],
        }
        result.append(r)
    return result


@postprocess(required=["apimon.log"])
def process_api_log(task: Task, resources: Dict[str, Resource], minio):
    res_log = resources["apimon.log"]
    log = BytesIO(res_log.content)
    data = json.dumps(process_logfile(log)).encode()
    file = BytesIO(data)
    analysis_uid = task.payload["analysis_uid"]
    minio.put_object("drakrun", f"{analysis_uid}/apicall.json", file, len(data))
