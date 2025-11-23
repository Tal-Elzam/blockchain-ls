"""
Rate limiter for blockchain.info API calls
Prevents hitting API rate limits by controlling request frequency
"""
import asyncio
import time
from collections import defaultdict
from typing import Dict


# According to blockchain.info API documentation:
# "Limit your queries to a maximum of 1 every 10 seconds"
MIN_DELAY_BETWEEN_REQUESTS = 10.0  # Minimum 10 seconds between requests
MAX_REQUESTS_PER_MINUTE = 6  # Maximum 6 

# Track request times per IP/address pattern
request_times: Dict[str, list] = defaultdict(list)
last_request_time: Dict[str, float] = defaultdict(lambda: 0.0)
_lock = asyncio.Lock()


async def wait_for_rate_limit(identifier: str = "default") -> None:
    """
    Wait if necessary to respect rate limits
    
    Args:
        identifier: Identifier for rate limiting (IP, user, etc.)
    """
    async with _lock:
        current_time = time.time()
        last_time = last_request_time[identifier]
        
        # Calculate time since last request
        time_since_last = current_time - last_time
        
        # Wait if needed to maintain minimum delay
        if time_since_last < MIN_DELAY_BETWEEN_REQUESTS:
            wait_time = MIN_DELAY_BETWEEN_REQUESTS - time_since_last
            await asyncio.sleep(wait_time)
            current_time = time.time()
        # Clean old requests (older than 1 minute)
        one_minute_ago = current_time - 60
        request_times[identifier] = [
            req_time for req_time in request_times[identifier]
            if req_time > one_minute_ago
        ]
        
        # Check if we've exceeded the rate limit
        if len(request_times[identifier]) >= MAX_REQUESTS_PER_MINUTE:
            # Calculate wait time until oldest request expires
            oldest_request = min(request_times[identifier])
            wait_time = 60 - (current_time - oldest_request) + 1
            if wait_time > 0:
                await asyncio.sleep(wait_time)
                current_time = time.time()
                # Clean again after waiting
                one_minute_ago = current_time - 60
                request_times[identifier] = [
                    req_time for req_time in request_times[identifier]
                    if req_time > one_minute_ago
                ]
        
        request_times[identifier].append(current_time)
        last_request_time[identifier] = current_time

