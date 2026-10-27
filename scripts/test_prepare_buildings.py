import importlib.util
import json
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('prepare',Path(__file__).with_name('prepare-buildings.py'))
p=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

def fixture(tags=None):
    points=[(98,8),(98.001,8),(98.001,8.001),(98,8.001)]
    return {'bounds':{'minlon':97.99,'minlat':7.99,'maxlon':98.01,'maxlat':8.01},'elements':[{'type':'node','id':i+1,'lon':x,'lat':y} for i,(x,y) in enumerate(points)]+[{'type':'way','id':5,'nodes':[1,2,3,4,1],'tags':tags or {'building':'yes'}}]}

def build(raw):
    return p.build_snapshot(raw,json.dumps(raw).encode(),'format-test','2026-10-28T00:00:00Z')

class BuildingPreparation(unittest.TestCase):
    def test_units_are_anchored_and_converted(self):
        self.assertAlmostEqual(p.tagged_height('10 ft'),3.048)
        self.assertAlmostEqual(p.tagged_height('10\'6"'),3.2004)
        self.assertAlmostEqual(p.tagged_height('36"'),.9144)
        self.assertEqual(p.tagged_height('12 m'),12)
        for value in ['10 yards','10;12','prefix10','-2','NaN','10\'13"']:
            self.assertIsNone(p.tagged_height(value))
    def test_valid_height_does_not_crash_source_counter(self):
        out=build(fixture({'building':'hotel','height':'10 ft'}))
        self.assertEqual(out['counts']['heightTag'],1)
        self.assertEqual(out['features'][0]['properties']['height'],3.048)
    def test_unknown_stays_unknown_even_for_hotel_class(self):
        out=build(fixture({'building':'hotel'}))
        self.assertIsNone(out['features'][0]['properties']['height'])
        self.assertEqual(out['counts']['unknown'],1)
    def test_decimal_levels_retained_ambiguous_levels_not_guessed(self):
        out=build(fixture({'building':'yes','building:levels':'2.5'}))
        self.assertEqual(out['features'][0]['properties']['levels'],2.5)
        self.assertEqual(out['features'][0]['properties']['height'],7.5)
        out=build(fixture({'building':'yes','building:levels':'2;3'}))
        self.assertIsNone(out['features'][0]['properties']['height'])
    def test_rings_are_closed_and_preserve_original_nodes(self):
        raw=fixture();out=build(raw);ring=out['features'][0]['geometry']['coordinates'][0]
        self.assertEqual(ring[0],ring[-1]);self.assertEqual(len(ring),5)
        source={(n['lon'],n['lat']) for n in raw['elements'] if n['type']=='node'}
        self.assertEqual(set(map(tuple,ring)),source)
    def test_missing_nodes_or_open_ways_never_get_connected(self):
        raw=fixture();raw['elements'][0]['id']=99
        self.assertEqual(build(raw)['features'],[])
        raw=fixture();raw['elements'][-1]['nodes']=[1,2,3,4]
        self.assertEqual(build(raw)['features'],[])
    def test_degenerate_crossing_and_nonbuilding_are_excluded(self):
        raw=fixture();raw['elements'][-1]['nodes']=[1,3,2,4,1]
        self.assertEqual(build(raw)['features'],[])
        self.assertEqual(build(fixture({'building':'no'}))['features'],[])
    def test_provenance_does_not_change_to_processing_day(self):
        out=build(fixture())
        self.assertEqual(out['retrievedAt'],'2026-10-28T00:00:00Z')
        self.assertEqual(out['queryBounds'],[97.99,7.99,98.01,8.01])
        self.assertEqual(len(out['rawSha256']),64)
        self.assertIn('97.99,7.99,98.01,8.01',out['sourceUrl'])
    def test_camera_reference_uses_source_street_node_outside_building(self):
        raw=fixture();raw['elements'] += [{'type':'node','id':6,'lon':98.002,'lat':8},{'type':'node','id':7,'lon':98.002,'lat':8.001},{'type':'way','id':99,'nodes':[6,7],'tags':{'highway':'footway'}}]
        out=p.build_snapshot(raw,json.dumps(raw).encode(),'format-test','2026-10-28T00:00:00Z',camera_origin=(98.0005,8.0005))
        self.assertIn(out['walkStart']['coord'],[[98.002,8],[98.002,8.001]])
        self.assertEqual(out['walkStart']['way'],'way/99')

    def test_whole_ways_may_extend_beyond_query_bounds(self):
        raw=fixture();raw['bounds']['maxlon']=98.0005
        out=build(raw)
        self.assertGreater(out['geometryBounds'][2],out['queryBounds'][2])

if __name__=='__main__':
    unittest.main()
