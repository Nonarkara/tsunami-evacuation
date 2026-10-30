import importlib.util
import json
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('inspect_ddpm',Path(__file__).with_name('inspect-ddpm.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DdpmInspectionTest(unittest.TestCase):
    def test_pv_aliases_cannot_merge_provinces_and_numeric_codes_remain_labels(self):
        csv=b'pcode,pname,Height,Risk,Y_Lat,X_Long,People_All,House,mcode,side,PV\n82,PhangNga,0,1,8.6,98.2,,,,Andaman,PN\n94,Pattani,19.6,4,6.8,101.2,12,3,9401,Gulf,PN\n'
        meta={'result':{'resources':[{'id':'033cdf9d-2357-4683-9ce6-ae3b378bc9f1','last_modified':'2024-11-14'}],'last_updated_date':'2024-01-30','metadata_modified':'2024-11-18'}}
        data=module.inspect(csv,json.dumps(meta).encode(),'2026-10-30T00:00:00Z')
        self.assertEqual([p['pcode'] for p in data['provinces']],[82,94])
        self.assertEqual(data['riskCodes'],{'1':1,'4':1})
        self.assertEqual(data['missing']['People_All'],1)
        self.assertIsNone(data['heightRaw']['unit'])
        with self.assertRaises(ValueError): module.inspect(csv.replace(b',19.6,',b',NaN,'),json.dumps(meta).encode(),'stamp')
