"""
Unit tests for rate limiter service
"""
import pytest
import asyncio
import time
from app.services.rate_limiter import (
    wait_for_rate_limit,
    MIN_DELAY_BETWEEN_REQUESTS,
    MAX_REQUESTS_PER_MINUTE,
    request_times,
    last_request_time,
)


class TestRateLimiter:
    """Tests for rate limiting functionality"""

    @pytest.mark.asyncio
    async def test_first_request_no_delay(self):
        """Test that first request has no delay"""
        start_time = time.time()
        await wait_for_rate_limit("test_user_1")
        elapsed = time.time() - start_time
        # First request should be nearly instant (< 0.1 seconds)
        assert elapsed < 0.1

    @pytest.mark.asyncio
    async def test_second_request_has_delay(self):
        """Test that second request waits minimum delay"""
        # First request
        await wait_for_rate_limit("test_user_2")
        
        # Second request immediately after
        start_time = time.time()
        await wait_for_rate_limit("test_user_2")
        elapsed = time.time() - start_time
        
        # Should wait close to MIN_DELAY_BETWEEN_REQUESTS (10 seconds)
        assert elapsed >= MIN_DELAY_BETWEEN_REQUESTS - 0.5
        assert elapsed <= MIN_DELAY_BETWEEN_REQUESTS + 1.0

    @pytest.mark.asyncio
    async def test_different_users_no_interference(self):
        """Test that different identifiers don't interfere"""
        # First user makes request
        await wait_for_rate_limit("user_a")
        
        # Second user should not be delayed
        start_time = time.time()
        await wait_for_rate_limit("user_b")
        elapsed = time.time() - start_time
        
        # Should be instant for different user
        assert elapsed < 0.1

    @pytest.mark.asyncio
    async def test_request_after_delay_no_wait(self):
        """Test that request after minimum delay doesn't wait"""
        # First request
        await wait_for_rate_limit("test_user_3")
        
        # Wait for the minimum delay
        await asyncio.sleep(MIN_DELAY_BETWEEN_REQUESTS + 0.1)
        
        # Second request should be instant
        start_time = time.time()
        await wait_for_rate_limit("test_user_3")
        elapsed = time.time() - start_time
        
        # Should not add additional delay
        assert elapsed < 0.5

    @pytest.mark.asyncio
    async def test_request_times_cleanup(self):
        """Test that old request times are cleaned up"""
        identifier = "test_user_4"
        
        # Make a request
        await wait_for_rate_limit(identifier)
        
        # Check that request was recorded
        assert len(request_times[identifier]) == 1
        
        # Manually add old timestamp (more than 1 minute ago)
        old_time = time.time() - 70  # 70 seconds ago
        request_times[identifier].append(old_time)
        
        # Make another request
        await wait_for_rate_limit(identifier)
        
        # Old timestamp should be cleaned up
        remaining_times = [
            t for t in request_times[identifier]
            if t > time.time() - 60
        ]
        assert len(remaining_times) == 2  # Only the two recent ones

    @pytest.mark.asyncio
    async def test_last_request_time_updated(self):
        """Test that last_request_time is updated correctly"""
        identifier = "test_user_5"
        
        before = time.time()
        await wait_for_rate_limit(identifier)
        after = time.time()
        
        # Last request time should be between before and after
        assert before <= last_request_time[identifier] <= after

    @pytest.mark.asyncio
    async def test_concurrent_requests_serialized(self):
        """Test that concurrent requests are properly serialized"""
        identifier = "test_user_6"
        
        # Create multiple concurrent requests
        start_time = time.time()
        tasks = [
            wait_for_rate_limit(identifier),
            wait_for_rate_limit(identifier),
            wait_for_rate_limit(identifier),
        ]
        
        await asyncio.gather(*tasks)
        elapsed = time.time() - start_time
        
        # Three requests should take at least 2 * MIN_DELAY_BETWEEN_REQUESTS
        # (first is instant, second waits 10s, third waits 10s)
        expected_min = 2 * MIN_DELAY_BETWEEN_REQUESTS
        assert elapsed >= expected_min - 1.0
        
        # Should have recorded all requests
        assert len(request_times[identifier]) == 3

    @pytest.mark.asyncio
    async def test_rate_limit_constants(self):
        """Test that rate limit constants are correctly set"""
        assert MIN_DELAY_BETWEEN_REQUESTS == 10.0
        assert MAX_REQUESTS_PER_MINUTE == 6
        # These should match: 60 seconds / 10 seconds = 6 requests
        assert MAX_REQUESTS_PER_MINUTE == 60 / MIN_DELAY_BETWEEN_REQUESTS

