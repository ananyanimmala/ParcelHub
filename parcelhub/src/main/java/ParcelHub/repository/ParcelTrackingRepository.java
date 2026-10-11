package ParcelHub.repository;

import ParcelHub.entity.Parcel;
import ParcelHub.entity.ParcelTracking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParcelTrackingRepository
        extends JpaRepository<ParcelTracking, Long> {

    List<ParcelTracking> findByParcelOrderByUpdatedAtAsc(Parcel parcel);
}