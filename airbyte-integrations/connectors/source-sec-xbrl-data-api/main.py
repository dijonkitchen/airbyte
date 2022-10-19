#
# Copyright (c) 2022 Airbyte, Inc., all rights reserved.
#


import sys

from airbyte_cdk.entrypoint import launch
from source_sec_xbrl_data_api import SourceSecXbrlDataApi

if __name__ == "__main__":
    source = SourceSecXbrlDataApi()
    launch(source, sys.argv[1:])
